import { Request, Response, NextFunction } from 'express';
import WorkLog from '../models/WorkLog.js';
import Customer from '../models/Customer.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * @swagger
 * /api/v1/worklogs:
 *   post:
 *     summary: Create a new work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logDate
 *               - description
 *               - result
 *             properties:
 *               customerId:
 *                 type: integer
 *               taskId:
 *                 type: integer
 *               logDate:
 *                 type: string
 *                 format: date
 *               durationMinutes:
 *                 type: integer
 *               description:
 *                 type: string
 *               result:
 *                 type: string
 *     responses:
 *       201:
 *         description: Work log created successfully
 */
export const createWorkLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, taskId, logDate, durationMinutes, description, result } = req.body;
    const userId = req.user?.userId;

    if (!logDate || !description || !result) {
      throw new ValidationError('Log date, description, and result are required');
    }

    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    // Verify customer exists if provided
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        throw new NotFoundError('Customer');
      }
    }

    // Verify task exists if provided
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) {
        throw new NotFoundError('Task');
      }
    }

    const workLog = await WorkLog.create({
      userId,
      customerId,
      taskId,
      logDate: new Date(logDate),
      durationMinutes,
      description,
      result,
    });

    const createdWorkLog = await WorkLog.findByPk(workLog.id, {
      include: [
        { model: User, as: 'loggedBy', attributes: ['id', 'username', 'fullName'] },
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: Task, as: 'task', attributes: ['id', 'title'] },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        workLog: createdWorkLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/worklogs:
 *   get:
 *     summary: Get list of work logs
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of work logs
 */
export const getWorkLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, customerId, taskId } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (taskId) {
      where.taskId = taskId;
    }

    const workLogs = await WorkLog.findAll({
      where,
      include: [
        { model: User, as: 'loggedBy', attributes: ['id', 'username', 'fullName'] },
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: Task, as: 'task', attributes: ['id', 'title'] },
      ],
      order: [['logDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        workLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}/worklogs:
 *   get:
 *     summary: Get work logs for a specific customer
 *     tags: [WorkLogs]
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
 *         description: Customer work logs
 */
export const getCustomerWorkLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new NotFoundError('Customer');
    }

    const workLogs = await WorkLog.findAll({
      where: { customerId: id },
      include: [
        { model: User, as: 'loggedBy', attributes: ['id', 'username', 'fullName'] },
        { model: Task, as: 'task', attributes: ['id', 'title'] },
      ],
      order: [['logDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        workLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};
