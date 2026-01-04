import { Router } from 'express';
import {
  createWorkLog,
  getWorkLogs,
  getCustomerWorkLogs,
} from '';
import { authenticate } from '';
import { requireAnyPermission, requirePermission } from '';

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
