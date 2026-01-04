import { Router } from 'express';
import { createOrder, getOrders, getOrderById } from '';
import { authenticate } from '';
import { requirePermission } from '';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

router.post('/', authenticate, requirePermission('orders:create'), createOrder);
router.get('/', authenticate, requirePermission('orders:read'), getOrders);
router.get('/:id', authenticate, requirePermission('orders:read'), getOrderById);

export default router;
