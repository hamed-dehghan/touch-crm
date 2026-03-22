// backend/src/controllers/task.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Task, { TaskStatus } from '../models/Task.js';
import TaskAttachment from '../models/TaskAttachment.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { dateRangeOnField, getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';

/** Shared include config for task queries */
const taskIncludes = [
  { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'companyName'] },
  { model: Project, as: 'project', attributes: ['id', 'projectName'] },
  { model: User, as: 'assignedTo', attributes: ['id', 'username', 'fullName'] },
  { model: User, as: 'createdBy', attributes: ['id', 'username', 'fullName'] },
  { model: TaskAttachment, as: 'attachments' },
];

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
 *               customerId:
 *                 type: integer
 *               projectId:
 *                 type: integer
 *               assignedToUserId:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               dueTime:
 *                 type: string
 *                 example: "14:30"
 *               reminderDaysBefore:
 *                 type: integer
 *               isRecurring:
 *                 type: boolean
 *               recurringIntervalDays:
 *                 type: integer
 *               recurringStartDate:
 *                 type: string
 *                 format: date
 *               recurringEndDate:
 *                 type: string
 *                 format: date
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
      customerId,
      projectId,
      assignedToUserId,
      dueDate,
      dueTime,
      reminderDaysBefore,
      isRecurring,
      recurringIntervalDays,
      recurringStartDate,
      recurringEndDate,
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

    // Verify customer exists if provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer');
      }
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
      customerId,
      projectId,
      assignedToUserId,
      createdByUserId: userId || 1,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime,
      reminderDaysBefore,
      status: TaskStatus.PENDING,
      isRecurring: isRecurring || false,
      recurringIntervalDays,
      recurringStartDate,
      recurringEndDate,
      lastTriggeredAt: isRecurring ? new Date() : undefined,
    });

    const createdTask = await Task.findByPk(task.id, { include: taskIncludes });

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
 *     description: Same query parameters as GET /tasks for search and filters; results are limited to the current user.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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

    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { projectId, customerId, status, dueDateFrom, dueDateTo } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = { assignedToUserId: userId };
    if (projectId) where.projectId = projectId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    const dueRange = dateRangeOnField('dueDate', dueDateFrom as string | undefined, dueDateTo as string | undefined);
    if (dueRange) Object.assign(where, dueRange);

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['title', 'description'], q)],
          }
        : where;

    const { count, rows } = await Task.findAndCountAll({
      where: searchWhere,
      include: taskIncludes,
      limit,
      offset,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
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
 *         name: q
 *         description: Basic search on title and description
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         description: Advanced filter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customerId
 *         description: Advanced filter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: assignedToUserId
 *         description: Advanced filter — assignee user id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: dueDateFrom
 *         description: Advanced filter — due date range (start)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateTo
 *         description: Advanced filter — due date range (end)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { projectId, customerId, status, assignedToUserId, dueDateFrom, dueDateTo } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (assignedToUserId) where.assignedToUserId = assignedToUserId;
    const dueRange = dateRangeOnField('dueDate', dueDateFrom as string | undefined, dueDateTo as string | undefined);
    if (dueRange) Object.assign(where, dueRange);

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['title', 'description'], q)],
          }
        : where;

    const { count, rows } = await Task.findAndCountAll({
      where: searchWhere,
      include: taskIncludes,
      limit,
      offset,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
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

    const task = await Task.findByPk(id, { include: taskIncludes });

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
    const {
      title,
      description,
      customerId,
      assignedToUserId,
      projectId,
      dueDate,
      dueTime,
      reminderDaysBefore,
      isRecurring,
      recurringIntervalDays,
      recurringStartDate,
      recurringEndDate,
    } = req.body;

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

    // Verify customer if provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer');
      }
    }

    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      customerId: customerId !== undefined ? customerId : task.customerId,
      assignedToUserId: assignedToUserId || task.assignedToUserId,
      projectId: projectId !== undefined ? projectId : task.projectId,
      dueDate: dueDate ? new Date(dueDate) : task.dueDate,
      dueTime: dueTime !== undefined ? dueTime : task.dueTime,
      reminderDaysBefore: reminderDaysBefore !== undefined ? reminderDaysBefore : task.reminderDaysBefore,
      isRecurring: isRecurring !== undefined ? isRecurring : task.isRecurring,
      recurringIntervalDays:
        recurringIntervalDays !== undefined ? recurringIntervalDays : task.recurringIntervalDays,
      recurringStartDate:
        recurringStartDate !== undefined ? recurringStartDate : task.recurringStartDate,
      recurringEndDate:
        recurringEndDate !== undefined ? recurringEndDate : task.recurringEndDate,
    });

    const updatedTask = await Task.findByPk(id, { include: taskIncludes });

    res.json({
      success: true,
      data: {
        task: updatedTask,
      },
    });
  } catch (error) {
    next(error);
  }
};
