import { Router } from 'express';
import { createOrder, getOrders, getOrderById } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createOrderSchema } from '../validations/order.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

router.post('/', authenticate, requirePermission('orders:create'), validate(createOrderSchema), createOrder);
router.get('/', authenticate, requirePermission('orders:read'), getOrders);
router.get('/:id', authenticate, requirePermission('orders:read'), getOrderById);

export default router;
