import { Router } from 'express';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  assignPermissions,
  removePermission,
} from '../controllers/role.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and permission management endpoints (Admin only)
 */

router.get('/', authenticate, requirePermission('roles:manage'), getRoles);
router.get('/permissions', authenticate, requirePermission('roles:manage'), getPermissions);
router.get('/:id', authenticate, requirePermission('roles:manage'), getRoleById);
router.post('/', authenticate, requirePermission('roles:manage'), createRole);
router.put('/:id', authenticate, requirePermission('roles:manage'), updateRole);
router.delete('/:id', authenticate, requirePermission('roles:manage'), deleteRole);
router.post('/:id/permissions', authenticate, requirePermission('roles:manage'), assignPermissions);
router.delete(
  '/:id/permissions/:permissionId',
  authenticate,
  requirePermission('roles:manage'),
  removePermission
);

export default router;
