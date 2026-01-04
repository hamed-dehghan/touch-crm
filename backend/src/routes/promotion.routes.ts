import { Router } from 'express';
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  assignPromotionToCustomer,
} from '';
import { authenticate } from '';
import { requirePermission } from '';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Promotions
 *   description: Promotion management endpoints (Admin/Manager only)
 */

router.post('/', authenticate, requirePermission('promotions:create'), createPromotion);
router.get('/', authenticate, requirePermission('promotions:read'), getPromotions);
router.get('/:id', authenticate, requirePermission('promotions:read'), getPromotionById);
router.put('/:id', authenticate, requirePermission('promotions:update'), updatePromotion);
router.delete('/:id', authenticate, requirePermission('promotions:delete'), deletePromotion);
router.post(
  '/:id/assign',
  authenticate,
  requirePermission('promotions:create'),
  assignPromotionToCustomer
);

export default router;
