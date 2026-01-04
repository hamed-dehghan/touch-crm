import { Request, Response, NextFunction } from 'express';
import Task, { TaskStatus } from '';
import Project from '../models/Project';
import User from '../models/User';
import { NotFoundError, ValidationError } from '';

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - assignedToUserId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: integer
 *               assignedToUserId:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               isRecurring:
 *                 type: boolean
 *               recurringIntervalDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Task created successfully
 */
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      projectId,
      assignedToUserId,
      dueDate,
      isRecurring,
      recurringIntervalDays,
    } = req.body;
    const userId = req.user?.userId;

    if (!title || !assignedToUserId) {
      throw new ValidationError('Title and assignedToUserId are required');
    }

    // Verify assigned user exists
    const assignedUser = await User.findByPk(assignedToUserId);
    if (!assignedUser) {
      throw new NotFoundError('Assigned user');
    }

    // Verify project exists if provided
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new NotFoundError('Project');
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedToUserId,
      createdByUserId: userId || 1,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: TaskStatus.PENDING,
      isRecurring: isRecurring || false,
      recurringIntervalDays,
      lastTriggeredAt: isRecurring ? new Date() : null,
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'projectName'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'createdBy', attributes: ['id', 'username', 'fullName'] },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        task: createdTask,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/tasks/my-tasks:
 *   get:
 *     summary: Get tasks assigned to current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tasks
 */
export const getMyTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const tasks = await Task.findAll({
      where: { assignedToUserId: userId },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'projectName'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'createdBy', attributes: ['id', 'username', 'fullName'] },
      ],
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get list of all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks
 */
export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectId, status } = req.query;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'projectName'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'createdBy', attributes: ['id', 'username', 'fullName'] },
      ],
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task details
 */
export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignedTo' },
        { model: User, as: 'createdBy' },
      ],
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    res.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/tasks/{id}/status:
 *   put:
 *     summary: Update task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Task status updated successfully
 */
export const updateTaskStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(TaskStatus).includes(status)) {
      throw new ValidationError('Valid status is required');
    }

    const task = await Task.findByPk(id);

    if (!task) {
      throw new NotFoundError('Task');
    }

    await task.update({ status });

    res.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update task details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, assignedToUserId, dueDate, isRecurring, recurringIntervalDays } =
      req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      throw new NotFoundError('Task');
    }

    // Verify assigned user if provided
    if (assignedToUserId) {
      const user = await User.findByPk(assignedToUserId);
      if (!user) {
        throw new NotFoundError('Assigned user');
      }
    }

    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      assignedToUserId: assignedToUserId || task.assignedToUserId,
      dueDate: dueDate ? new Date(dueDate) : task.dueDate,
      isRecurring: isRecurring !== undefined ? isRecurring : task.isRecurring,
      recurringIntervalDays:
        recurringIntervalDays !== undefined ? recurringIntervalDays : task.recurringIntervalDays,
    });

    res.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};
