import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Payment transaction management endpoints
 */

router.post(
  '/',
  authenticate,
  requirePermission('orders:create'), // Reuse orders permission for transactions
  createTransaction
);

router.get(
  '/',
  authenticate,
  requirePermission('orders:read'),
  getTransactions
);

router.get(
  '/:id',
  authenticate,
  requirePermission('orders:read'),
  getTransactionById
);

export default router;
