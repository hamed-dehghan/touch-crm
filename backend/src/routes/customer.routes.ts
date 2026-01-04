import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '';
import { getCustomerWorkLogs } from '';
import { getCustomerTransactions } from '';
import { authenticate } from '';
import { requirePermission, requireAnyPermission } from '';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

router.post(
  '/',
  authenticate,
  requirePermission('customers:create'),
  createCustomer
);

router.get(
  '/',
  authenticate,
  requireAnyPermission(['customers:read_own', 'customers:read_all']),
  getCustomers
);

router.get(
  '/:id',
  authenticate,
  requireAnyPermission(['customers:read_own', 'customers:read_all']),
  getCustomerById
);

router.put(
  '/:id',
  authenticate,
  requireAnyPermission(['customers:update_own', 'customers:update_all']),
  updateCustomer
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('customers:delete'),
  deleteCustomer
);

router.get(
  '/:id/worklogs',
  authenticate,
  requireAnyPermission(['worklogs:read_own', 'worklogs:read_all']),
  getCustomerWorkLogs
);

router.get(
  '/:id/transactions',
  authenticate,
  requirePermission('orders:read'),
  getCustomerTransactions
);

export default router;
