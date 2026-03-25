import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getIranLocationsTree } from '../controllers/location.controller.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location tree endpoints (province/city)
 */
router.get('/iran', authenticate, getIranLocationsTree);

export default router;

