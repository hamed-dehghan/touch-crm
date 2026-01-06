import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import orderRoutes from './order.routes';
import promotionRoutes from './promotion.routes';
import campaignRoutes from './campaign.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import worklogRoutes from './worklog.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

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
