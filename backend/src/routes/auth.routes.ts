import { Router } from 'express';
import { login, register, getCurrentUser } from '';
import { authenticate } from '';
import { requirePermission } from '';

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
