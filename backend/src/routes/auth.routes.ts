import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router: Router = Router();

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
