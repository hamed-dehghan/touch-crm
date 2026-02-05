import { Router } from 'express';
import {
  createTask,
  getMyTasks,
  getTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
} from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAnyPermission, requirePermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

router.post('/', authenticate, requirePermission('tasks:create'), createTask);
router.get('/my-tasks', authenticate, requirePermission('tasks:read_own'), getMyTasks);
router.get(
  '/',
  authenticate,
  requireAnyPermission(['tasks:read_own', 'tasks:read_all']),
  getTasks
);
router.get(
  '/:id',
  authenticate,
  requireAnyPermission(['tasks:read_own', 'tasks:read_all']),
  getTaskById
);
router.put(
  '/:id/status',
  authenticate,
  requirePermission('tasks:update_status_own'),
  updateTaskStatus
);
router.put(
  '/:id',
  authenticate,
  requireAnyPermission(['tasks:update_own', 'tasks:update_all']),
  updateTask
);

export default router;
