import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { NotFoundError } from '../utils/errors.js';
import { createTransactionSchema } from '../validations/transaction.validation.js';
import {
  dateRangeOnField,
  getBasicSearchString,
  isDigitsOnly,
  parsePagination,
  wrapIlike,
} from '../utils/search.utils.js';

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
 *     description: |
 *       Basic search (`q`) matches transaction id (numeric), payment method text, and linked customer name/code.
 *       Combine with explicit filters for advanced queries.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         description: Advanced filter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: orderId
 *         description: Advanced filter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: paymentMethod
 *         description: Advanced filter — CASH or CHECK
 *         schema:
 *           type: string
 *           enum: [CASH, CHECK]
 *       - in: query
 *         name: transactionDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: transactionDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
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
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const {
      customerId,
      orderId,
      paymentMethod,
      transactionDateFrom,
      transactionDateTo,
      minAmount,
      maxAmount,
    } = req.query;

    const baseFilters: Record<string, unknown> = {};
    if (customerId !== undefined && customerId !== '') {
      baseFilters.customerId = customerId;
    }
    if (orderId !== undefined && orderId !== '') {
      baseFilters.orderId = orderId;
    }
    if (paymentMethod !== undefined && paymentMethod !== '') {
      baseFilters.paymentMethod = paymentMethod;
    }

    const dr = dateRangeOnField(
      'transactionDate',
      transactionDateFrom as string | undefined,
      transactionDateTo as string | undefined
    );
    if (dr) Object.assign(baseFilters, dr);

    const amt: Record<string | symbol, number> = {};
    if (minAmount !== undefined && minAmount !== '') {
      const n = Number(minAmount);
      if (!Number.isNaN(n)) amt[Op.gte] = n;
    }
    if (maxAmount !== undefined && maxAmount !== '') {
      const n = Number(maxAmount);
      if (!Number.isNaN(n)) amt[Op.lte] = n;
    }
    if (Object.keys(amt).length > 0) {
      baseFilters.amount = amt;
    }

    let where: Record<string, unknown> = baseFilters;

    if (q) {
      const pattern = wrapIlike(q);
      const searchOr: Record<string, unknown>[] = [
        { '$customer.firstName$': { [Op.iLike]: pattern } },
        { '$customer.lastName$': { [Op.iLike]: pattern } },
        { '$customer.customerCode$': { [Op.iLike]: pattern } },
        { paymentMethod: { [Op.iLike]: pattern } },
      ];
      if (isDigitsOnly(q)) {
        const id = parseInt(q, 10);
        if (id > 0) searchOr.push({ id });
      }
      where = {
        [Op.and]: [baseFilters, { [Op.or]: searchOr }],
      };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit,
      offset,
      subQuery: false,
      distinct: true,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'customerCode'],
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
          attributes: ['id', 'firstName', 'lastName', 'customerCode', 'email'],
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
          customerCode: customer.customerCode,
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
