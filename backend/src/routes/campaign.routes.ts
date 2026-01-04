import { Router } from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  executeCampaignEndpoint,
} from '';
import { authenticate } from '';
import { requirePermission } from '';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign management endpoints (Admin/Manager only)
 */

router.post('/', authenticate, requirePermission('campaigns:create'), createCampaign);
router.get('/', authenticate, requirePermission('campaigns:read'), getCampaigns);
router.get('/:id', authenticate, requirePermission('campaigns:read'), getCampaignById);
router.put('/:id', authenticate, requirePermission('campaigns:update'), updateCampaign);
router.post(
  '/:id/execute',
  authenticate,
  requirePermission('campaigns:execute'),
  executeCampaignEndpoint
);

export default router;
