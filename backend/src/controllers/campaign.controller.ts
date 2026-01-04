import { Request, Response, NextFunction } from 'express';
import Campaign, { CampaignStatus } from '';
import { NotFoundError, ValidationError } from '';
import { executeCampaign } from '';
import User from '../models/User';

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
      scheduledSendTime: scheduledSendTime ? new Date(scheduledSendTime) : null,
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
    const campaigns = await Campaign.findAll({
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
        campaigns,
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
