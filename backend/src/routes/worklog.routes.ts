import { Router } from 'express';
import {
  createWorkLog,
  getWorkLogs,
} from '../controllers/worklog.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: WorkLogs
 *   description: Work log management endpoints
 */

router.post(
  '/',
  authenticate,
  requirePermission('worklogs:create'),
  createWorkLog
);
router.get(
  '/',
  authenticate,
  requireAnyPermission(['worklogs:read_own', 'worklogs:read_all']),
  getWorkLogs
);

export default router;
