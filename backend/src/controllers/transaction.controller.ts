import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import Customer from '../models/Customer';
import Order from '../models/Order';
import { NotFoundError } from '';
import { createTransactionSchema } from '';

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     summary: Create a new transaction (payment record)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - paymentMethod
 *               - amount
 *               - transactionDate
 *             properties:
 *               customerId:
 *                 type: integer
 *               orderId:
 *                 type: integer
 *                 nullable: true
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CHECK]
 *               amount:
 *                 type: number
 *               transactionDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */
export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await createTransactionSchema.validate(req.body);

    const { customerId, orderId, paymentMethod, amount, transactionDate } = req.body;

    // Verify customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new NotFoundError('Customer');
    }

    // Verify order exists if orderId provided
    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new NotFoundError('Order');
      }
      // Verify order belongs to customer
      if (order.customerId !== customerId) {
        throw new NotFoundError('Order does not belong to this customer');
      }
    }

    const transaction = await Transaction.create({
      customerId,
      orderId: orderId || undefined,
      paymentMethod,
      amount,
      transactionDate: new Date(transactionDate),
    });

    res.status(201).json({
      success: true,
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: Get list of transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of transactions
 */
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const { customerId, orderId } = req.query;

    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (orderId) {
      where.orderId = orderId;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderDate', 'finalAmount'],
          required: false,
        },
      ],
      order: [['transactionDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        transactions: rows,
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
 * /api/v1/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
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
 *         description: Transaction details
 */
export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'email'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderDate', 'finalAmount'],
          required: false,
        },
      ],
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    res.json({
      success: true,
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}/transactions:
 *   get:
 *     summary: Get payment history for a customer
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer transaction history
 */
export const getCustomerTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Verify customer exists
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new NotFoundError('Customer');
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: { customerId: id },
      limit,
      offset,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderDate', 'finalAmount'],
          required: false,
        },
      ],
      order: [['transactionDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
        },
        transactions: rows,
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
