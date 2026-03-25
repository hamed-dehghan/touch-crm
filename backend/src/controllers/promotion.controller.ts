import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Promotion, { RewardType } from '../models/Promotion.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import CustomerPromotion from '../models/CustomerPromotion.js';
import { getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';

/**
 * @swagger
 * /api/v1/promotions:
 *   post:
 *     summary: Create a new promotion (Admin only)
 *     tags: [Promotions]
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
 *               - rewardType
 *               - rewardValue
 *               - conditionJson
 *             properties:
 *               title:
 *                 type: string
 *               rewardType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *               rewardValue:
 *                 type: number
 *               conditionJson:
 *                 type: string
 *               durationDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Promotion created successfully
 */
export const createPromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, rewardType, rewardValue, conditionJson, durationDays, isActive } = req.body;

    if (!title || !rewardType || !rewardValue || !conditionJson) {
      throw new ValidationError('Title, rewardType, rewardValue, and conditionJson are required');
    }

    // Validate condition JSON
    try {
      JSON.parse(conditionJson);
    } catch (error) {
      throw new ValidationError('Invalid conditionJson format');
    }

    // Validate reward type
    if (!Object.values(RewardType).includes(rewardType)) {
      throw new ValidationError('Invalid rewardType');
    }

    const promotion = await Promotion.create({
      title,
      rewardType,
      rewardValue,
      conditionJson,
      durationDays,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: {
        promotion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/promotions:
 *   get:
 *     summary: Get list of promotions (Admin only)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search on title
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: rewardType
 *         description: Advanced filter
 *         schema:
 *           type: string
 *           enum: [PERCENTAGE, FIXED_AMOUNT]
 *       - in: query
 *         name: isActive
 *         description: Advanced filter
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
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
 *         description: List of promotions
 */
export const getPromotions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { rewardType, isActive } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (rewardType) {
      where.rewardType = rewardType;
    }
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['title'], q)],
          }
        : where;

    const { count, rows } = await Promotion.findAndCountAll({
      where: searchWhere,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        promotions: rows,
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
 * /api/v1/promotions/{id}:
 *   get:
 *     summary: Get promotion by ID
 *     tags: [Promotions]
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
 *         description: Promotion details
 */
export const getPromotionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      throw new NotFoundError('Promotion');
    }

    res.json({
      success: true,
      data: {
        promotion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/promotions/{id}:
 *   put:
 *     summary: Update promotion (Admin only)
 *     tags: [Promotions]
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
 *         description: Promotion updated successfully
 */
export const updatePromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, rewardType, rewardValue, conditionJson, durationDays, isActive } = req.body;

    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      throw new NotFoundError('Promotion');
    }

    // Validate condition JSON if provided
    if (conditionJson) {
      try {
        JSON.parse(conditionJson);
      } catch (error) {
        throw new ValidationError('Invalid conditionJson format');
      }
    }

    // Validate reward type if provided
    if (rewardType && !Object.values(RewardType).includes(rewardType)) {
      throw new ValidationError('Invalid rewardType');
    }

    await promotion.update({
      title: title || promotion.title,
      rewardType: rewardType || promotion.rewardType,
      rewardValue: rewardValue !== undefined ? rewardValue : promotion.rewardValue,
      conditionJson: conditionJson || promotion.conditionJson,
      durationDays: durationDays !== undefined ? durationDays : promotion.durationDays,
      isActive: isActive !== undefined ? isActive : promotion.isActive,
    });

    res.json({
      success: true,
      data: {
        promotion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/promotions/{id}:
 *   delete:
 *     summary: Delete promotion (Admin only)
 *     tags: [Promotions]
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
 *         description: Promotion deleted successfully
 */
export const deletePromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByPk(id);

    if (!promotion) {
      throw new NotFoundError('Promotion');
    }

    await promotion.destroy();

    res.json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deletePromotions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawIds = Array.isArray(req.body?.ids) ? req.body.ids : null;
    if (!rawIds || rawIds.length === 0) {
      throw new ValidationError('ids must be a non-empty array');
    }

    const ids = [...new Set(rawIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0))];
    if (ids.length !== rawIds.length) {
      throw new ValidationError('ids must contain valid unique positive integers');
    }

    const foundCount = await Promotion.count({ where: { id: { [Op.in]: ids } } });
    if (foundCount !== ids.length) {
      throw new ValidationError('One or more promotions were not found');
    }

    await Promotion.destroy({ where: { id: { [Op.in]: ids } } });

    res.json({
      success: true,
      data: { deletedCount: ids.length },
      message: 'Promotions deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/promotions/{id}/assign:
 *   post:
 *     summary: Manually assign promotion to customer
 *     tags: [Promotions]
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
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Promotion assigned successfully
 */
export const assignPromotionToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
      throw new NotFoundError('Promotion');
    }

    // Check if already assigned
    const existing = await CustomerPromotion.findOne({
      where: { customerId, promotionId: id, isUsed: false },
    });

    if (existing) {
      throw new ValidationError('Promotion already assigned to this customer');
    }

    // Calculate expiry date if duration is specified
    let expiryDate: Date | undefined;
    if (promotion.durationDays) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + promotion.durationDays);
    }

    const customerPromotion = await CustomerPromotion.create({
      customerId,
      promotionId: parseInt(id),
      assignedAt: new Date(),
      expiryDate,
      isUsed: false,
    });

    res.status(201).json({
      success: true,
      data: {
        customerPromotion,
      },
    });
  } catch (error) {
    next(error);
  }
};
