import { Router } from 'express';
import authRoutes from '';
import customerRoutes from '';
import productRoutes from '';
import userRoutes from '';
import roleRoutes from '';
import orderRoutes from '';
import promotionRoutes from '';
import campaignRoutes from '';
import projectRoutes from '';
import taskRoutes from '';
import worklogRoutes from '';
import transactionRoutes from '';

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
