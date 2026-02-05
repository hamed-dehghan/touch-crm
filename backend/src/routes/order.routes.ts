import { Router } from 'express';
import { createOrder, getOrders, getOrderById } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { createOrderSchema } from '../validations/order.validation.js';

const router: Router = Router();

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
