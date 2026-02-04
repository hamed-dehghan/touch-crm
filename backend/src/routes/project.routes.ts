import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
} from '../controllers/project.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAnyPermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

router.post(
  '/',
  authenticate,
  requireAnyPermission(['projects:create']),
  createProject
);
router.get(
  '/',
  authenticate,
  requireAnyPermission(['projects:read_own', 'projects:read_all']),
  getProjects
);
router.get(
  '/:id',
  authenticate,
  requireAnyPermission(['projects:read_own', 'projects:read_all']),
  getProjectById
);
router.put(
  '/:id',
  authenticate,
  requireAnyPermission(['projects:update']),
  updateProject
);

export default router;
