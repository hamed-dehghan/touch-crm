import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints
 */

router.post('/login', login);
router.post('/register', authenticate, requirePermission('users:create'), register);
router.get('/me', authenticate, getCurrentUser);

export default router;
