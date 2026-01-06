import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (Admin only)
 */

router.get('/', authenticate, requirePermission('users:read'), getUsers);
router.post('/', authenticate, requirePermission('users:create'), createUser);
router.put('/:id', authenticate, requirePermission('users:update'), updateUser);
router.delete('/:id', authenticate, requirePermission('users:delete'), deleteUser);

export default router;
