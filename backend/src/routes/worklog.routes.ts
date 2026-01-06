import { Router } from 'express';
import {
  createWorkLog,
  getWorkLogs,
} from '../controllers/worklog.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAnyPermission, requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

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
