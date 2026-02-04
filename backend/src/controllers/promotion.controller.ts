import { Request, Response, NextFunction } from 'express';
import Promotion, { RewardType } from '../models/Promotion.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import CustomerPromotion from '../models/CustomerPromotion.js';

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
 *     responses:
 *       200:
 *         description: List of promotions
 */
export const getPromotions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const promotions = await Promotion.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        promotions,
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
