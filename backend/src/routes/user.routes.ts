import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, deleteUsers } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (Admin only)
 */

router.get('/', authenticate, requirePermission('users:read'), getUsers);
router.post('/', authenticate, requirePermission('users:create'), createUser);
router.delete('/', authenticate, requirePermission('users:delete'), deleteUsers);
router.put('/:id', authenticate, requirePermission('users:update'), updateUser);
router.delete('/:id', authenticate, requirePermission('users:delete'), deleteUser);

export default router;
