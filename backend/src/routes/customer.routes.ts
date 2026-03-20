import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';
import {
  uploadProfileImage as uploadProfileImageHandler,
  uploadAttachments as uploadAttachmentsHandler,
  deleteAttachment,
} from '../controllers/upload.controller.js';
import { getCustomerWorkLogs } from '../controllers/worklog.controller.js';
import { getCustomerTransactions } from '../controllers/transaction.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middlewares/rbac.middleware.js';
import {
  uploadProfileImage as profileImageUpload,
  uploadAttachments as attachmentsUpload,
} from '../middlewares/upload.middleware.js';

const router: Router = Router();

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

// File upload routes
router.post(
  '/:id/profile-image',
  authenticate,
  requireAnyPermission(['customers:update_own', 'customers:update_all']),
  profileImageUpload,
  uploadProfileImageHandler
);

router.post(
  '/:id/attachments',
  authenticate,
  requireAnyPermission(['customers:update_own', 'customers:update_all']),
  attachmentsUpload,
  uploadAttachmentsHandler
);

router.delete(
  '/:id/attachments/:attachmentId',
  authenticate,
  requireAnyPermission(['customers:update_own', 'customers:update_all']),
  deleteAttachment
);

// Nested resource routes
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
