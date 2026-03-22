import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import CustomerLevel from '../models/CustomerLevel.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';

/**
 * @swagger
 * /api/v1/customer-levels:
 *   get:
 *     summary: Get all customer levels
 *     tags: [Customer Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search on level name
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minScoreAtLeast
 *         description: Advanced filter — `min_score` greater or equal (levels starting at this band or higher)
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxScoreAtMost
 *         description: Advanced filter — `max_score` less or equal
 *         schema:
 *           type: number
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
 *         description: List of customer levels
 */
export const getCustomerLevels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { minScoreAtLeast, maxScoreAtMost } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (minScoreAtLeast !== undefined && minScoreAtLeast !== '') {
      const n = Number(minScoreAtLeast);
      if (!Number.isNaN(n)) {
        where.minScore = { [Op.gte]: n };
      }
    }
    if (maxScoreAtMost !== undefined && maxScoreAtMost !== '') {
      const n = Number(maxScoreAtMost);
      if (!Number.isNaN(n)) {
        where.maxScore = { [Op.lte]: n };
      }
    }

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['levelName'], q)],
          }
        : where;

    const { count, rows } = await CustomerLevel.findAndCountAll({
      where: searchWhere,
      limit,
      offset,
      order: [['minScore', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        customerLevels: rows,
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
 * /api/v1/customer-levels/{id}:
 *   get:
 *     summary: Get customer level by ID
 *     tags: [Customer Levels]
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
 *         description: Customer level details
 */
export const getCustomerLevelById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const customerLevel = await CustomerLevel.findByPk(id);

    if (!customerLevel) {
      throw new NotFoundError('Customer level');
    }

    res.json({
      success: true,
      data: {
        customerLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customer-levels/{id}:
 *   put:
 *     summary: Update customer level
 *     tags: [Customer Levels]
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
 *             properties:
 *               levelName:
 *                 type: string
 *               minScore:
 *                 type: number
 *               maxScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Customer level updated successfully
 */
export const updateCustomerLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { levelName, minScore, maxScore } = req.body;

    const customerLevel = await CustomerLevel.findByPk(id);
    if (!customerLevel) {
      throw new NotFoundError('Customer level');
    }

    const nextMinScore = minScore !== undefined ? Number(minScore) : Number(customerLevel.minScore);
    const nextMaxScore = maxScore !== undefined ? Number(maxScore) : Number(customerLevel.maxScore);

    if (Number.isNaN(nextMinScore) || Number.isNaN(nextMaxScore)) {
      throw new ValidationError('minScore and maxScore must be valid numbers');
    }

    if (nextMinScore > nextMaxScore) {
      throw new ValidationError('minScore cannot be greater than maxScore');
    }

    await customerLevel.update({
      levelName: levelName !== undefined ? levelName : customerLevel.levelName,
      minScore: nextMinScore,
      maxScore: nextMaxScore,
    });

    res.json({
      success: true,
      data: {
        customerLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};
