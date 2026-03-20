import { Router } from 'express';
import {
  getCustomerLevels,
  getCustomerLevelById,
  updateCustomerLevel,
} from '../controllers/customerLevel.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Customer Levels
 *   description: Customer loyalty levels (RFM) management
 */

router.get('/', authenticate, requirePermission('roles:manage'), getCustomerLevels);
router.get('/:id', authenticate, requirePermission('roles:manage'), getCustomerLevelById);
router.put('/:id', authenticate, requirePermission('roles:manage'), updateCustomerLevel);

export default router;
