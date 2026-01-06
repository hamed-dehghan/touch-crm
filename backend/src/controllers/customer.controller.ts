import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Customer, { CustomerStatus } from '../models/Customer';
import CustomerLevel from '../models/CustomerLevel';
import { NotFoundError, ValidationError } from '../utils/errors';
import { createCustomerSchema, updateCustomerSchema } from '../validations/customer.validation';
import { checkPromotionsForReferral, checkPromotionsAfterLevelChange } from '../services/promotionEvents.service';
import { sendWelcomeMessage } from '../services/automatedMessages.service';

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lastName
 *               - phoneNumber
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [LEAD, OPPORTUNITY, CUSTOMER]
 *     responses:
 *       201:
 *         description: Customer created successfully
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await createCustomerSchema.validate(req.body);

    const { phoneNumber, email } = req.body;

    // Check if phone number already exists
    const existingPhone = await Customer.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      throw new ValidationError('Phone number already exists');
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    const customer = await Customer.create({
      ...req.body,
      status: req.body.status || CustomerStatus.LEAD,
    });

    const createdCustomer = await Customer.findByPk(customer.id, {
      include: [{ model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName'] }],
    });

    // Check for referral promotions (async, non-blocking)
    if (customer.referredByCustomerId) {
      checkPromotionsForReferral(customer.id).catch((error) => {
        console.error('Error checking referral promotions:', error);
      });
    }

    // Send welcome message if customer status is CUSTOMER (async, non-blocking)
    if (customer.status === CustomerStatus.CUSTOMER) {
      sendWelcomeMessage(customer.id).catch((error) => {
        console.error('Error sending welcome message:', error);
      });
    }

    res.status(201).json({
      success: true,
      data: {
        customer: createdCustomer,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: Get list of customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customers
 */
export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    const where: any = {};

    // Apply status filter
    if (status) {
      where.status = status;
    }

    // Apply search filter
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // For users with read_own permission, filter by assigned customers
    // This would require a separate table for customer assignments
    // For now, we'll allow all customers if they have read_all or read_own
    // In a real implementation, you'd check customer assignments

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        customers: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        { model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName', 'minScore', 'maxScore'] },
      ],
    });

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    res.json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await updateCustomerSchema.validate(req.body);

    const { id } = req.params;
    const { phoneNumber, email } = req.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    // Check if phone number is being changed and already exists
    if (phoneNumber && phoneNumber !== customer.phoneNumber) {
      const existingPhone = await Customer.findOne({ where: { phoneNumber } });
      if (existingPhone) {
        throw new ValidationError('Phone number already exists');
      }
    }

    // Check if email is being changed and already exists
    if (email && email !== customer.email) {
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    const oldLevelId = customer.customerLevelId;

    await customer.update(req.body);

    const updatedCustomer = await Customer.findByPk(id, {
      include: [{ model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName'] }],
    });

    // Check for promotions if level changed (async, non-blocking)
    if (req.body.customerLevelId && req.body.customerLevelId !== oldLevelId) {
      checkPromotionsAfterLevelChange(parseInt(id)).catch((error) => {
        console.error('Error checking promotions after level change:', error);
      });
    }

    res.json({
      success: true,
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    await customer.destroy();

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
