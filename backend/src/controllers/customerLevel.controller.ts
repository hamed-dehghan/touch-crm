import { Request, Response, NextFunction } from 'express';
import CustomerLevel from '../models/CustomerLevel.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * @swagger
 * /api/v1/customer-levels:
 *   get:
 *     summary: Get all customer levels
 *     tags: [Customer Levels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer levels
 */
export const getCustomerLevels = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerLevels = await CustomerLevel.findAll({
      order: [['minScore', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        customerLevels,
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
