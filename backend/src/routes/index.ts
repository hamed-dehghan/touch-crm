import { Router } from 'express';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import productRoutes from './product.routes.js';
import userRoutes from './user.routes.js';
import roleRoutes from './role.routes.js';
import orderRoutes from './order.routes.js';
import promotionRoutes from './promotion.routes.js';
import campaignRoutes from './campaign.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import worklogRoutes from './worklog.routes.js';
import transactionRoutes from './transaction.routes.js';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/orders', orderRoutes);
router.use('/promotions', promotionRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/worklogs', worklogRoutes);
router.use('/transactions', transactionRoutes);

export default router;
