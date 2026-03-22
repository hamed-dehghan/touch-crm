import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Project, { ProjectStatus } from '../models/Project.js';
import Customer from '../models/Customer.js';
import { NotFoundError } from '../utils/errors.js';
import { getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - customerId
 *             properties:
 *               projectName:
 *                 type: string
 *               customerId:
 *                 type: integer
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       201:
 *         description: Project created successfully
 */
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { projectName, customerId, description, status } = req.body;

    if (!projectName || !customerId) {
      throw new Error('Project name and customer ID are required');
    }

    // Verify customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new NotFoundError('Customer');
    }

    const project = await Project.create({
      projectName,
      customerId,
      description,
      status: status || ProjectStatus.OPEN,
    });

    const createdProject = await Project.findByPk(project.id, {
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName'] }],
    });

    res.status(201).json({
      success: true,
      data: {
        project: createdProject,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get list of projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search on project name and description
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         description: Advanced filter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         description: Advanced filter
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
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
 *         description: List of projects
 */
export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { customerId, status } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (status) {
      where.status = status;
    }

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['projectName', 'description'], q)],
          }
        : where;

    const { count, rows } = await Project.findAndCountAll({
      where: searchWhere,
      limit,
      offset,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        projects: rows,
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
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
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
 *         description: Project details
 */
export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    res.json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
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
 *         description: Project updated successfully
 */
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { projectName, description, status } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    await project.update({
      projectName: projectName || project.projectName,
      description: description !== undefined ? description : project.description,
      status: status || project.status,
    });

    res.json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};
