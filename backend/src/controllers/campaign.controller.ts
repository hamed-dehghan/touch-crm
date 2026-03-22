import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Campaign, { CampaignStatus } from '../models/Campaign.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { executeCampaign } from '../services/campaign.service.js';
import User from '../models/User.js';
import { getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';

/**
 * @swagger
 * /api/v1/campaigns:
 *   post:
 *     summary: Create a new campaign (Admin/Manager only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - messageTemplate
 *             properties:
 *               name:
 *                 type: string
 *               messageTemplate:
 *                 type: string
 *               filterConditionsJson:
 *                 type: string
 *               scheduledSendTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, messageTemplate, filterConditionsJson, scheduledSendTime } = req.body;
    const userId = req.user?.userId;

    if (!name || !messageTemplate) {
      throw new ValidationError('Name and messageTemplate are required');
    }

    // Validate filter conditions JSON if provided
    if (filterConditionsJson) {
      try {
        JSON.parse(filterConditionsJson);
      } catch (error) {
        throw new ValidationError('Invalid filterConditionsJson format');
      }
    }

    const campaign = await Campaign.create({
      name,
      messageTemplate,
      filterConditionsJson: filterConditionsJson || '{}',
      scheduledSendTime: scheduledSendTime ? new Date(scheduledSendTime) : undefined,
      status: CampaignStatus.DRAFT,
      createdByUserId: userId || 1,
    });

    res.status(201).json({
      success: true,
      data: {
        campaign,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/campaigns:
 *   get:
 *     summary: Get list of campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search on name and message template
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         description: Advanced filter
 *         schema:
 *           type: string
 *           enum: [DRAFT, SCHEDULED, SENT, CANCELLED]
 *       - in: query
 *         name: createdByUserId
 *         description: Advanced filter
 *         schema:
 *           type: integer
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
 *         description: List of campaigns
 */
export const getCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { status, createdByUserId } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (createdByUserId !== undefined && createdByUserId !== '') {
      where.createdByUserId = Number(createdByUserId);
    }

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['name', 'messageTemplate'], q)],
          }
        : where;

    const { count, rows } = await Campaign.findAndCountAll({
      where: searchWhere,
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'username', 'fullName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        campaigns: rows,
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
 * /api/v1/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
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
 *         description: Campaign details
 */
export const getCampaignById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'username', 'fullName'],
        },
      ],
    });

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    res.json({
      success: true,
      data: {
        campaign,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
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
 *         description: Campaign updated successfully
 */
export const updateCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, messageTemplate, filterConditionsJson, scheduledSendTime, status } = req.body;

    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Validate filter conditions JSON if provided
    if (filterConditionsJson) {
      try {
        JSON.parse(filterConditionsJson);
      } catch (error) {
        throw new ValidationError('Invalid filterConditionsJson format');
      }
    }

    await campaign.update({
      name: name || campaign.name,
      messageTemplate: messageTemplate || campaign.messageTemplate,
      filterConditionsJson: filterConditionsJson !== undefined ? filterConditionsJson : campaign.filterConditionsJson,
      scheduledSendTime: scheduledSendTime ? new Date(scheduledSendTime) : campaign.scheduledSendTime,
      status: status || campaign.status,
    });

    res.json({
      success: true,
      data: {
        campaign,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/campaigns/{id}/execute:
 *   post:
 *     summary: Execute campaign (populate message queue)
 *     tags: [Campaigns]
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
 *         description: Campaign executed successfully
 */
export const executeCampaignEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const messageCount = await executeCampaign(parseInt(id));

    res.json({
      success: true,
      message: `Campaign executed successfully. ${messageCount} messages queued.`,
      data: {
        messageCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
