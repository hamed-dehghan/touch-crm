import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import {
  dateRangeOnField,
  getBasicSearchString,
  isDigitsOnly,
  parsePagination,
  wrapIlike,
} from '../utils/search.utils.js';

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order with order items
 *     description: Creates an order for a customer. Calculates totals from product prices, applies optional discount and tax.
 *     tags: [Orders]
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
 *               - orderItems
 *             properties:
 *               customerId:
 *                 type: integer
 *                 description: ID of the customer placing the order
 *                 example: 1
 *               orderItems:
 *                 type: array
 *                 description: List of products and quantities
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: ID of the product
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       description: Quantity of the product (defaults to 1)
 *                       example: 2
 *               discountAmount:
 *                 type: number
 *                 description: Optional discount amount to subtract from total
 *                 example: 10.00
 *               taxAmount:
 *                 type: number
 *                 description: Optional tax amount to add to total
 *                 example: 5.50
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         customerId:
 *                           type: integer
 *                         orderDate:
 *                           type: string
 *                           format: date-time
 *                         totalAmount:
 *                           type: number
 *                         discountAmount:
 *                           type: number
 *                         taxAmount:
 *                           type: number
 *                         finalAmount:
 *                           type: number
 *                         customer:
 *                           type: object
 *                         orderItems:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Validation error (missing required fields)
 *       404:
 *         description: Customer or product not found
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, orderItems, discountAmount, taxAmount } = req.body;

    // Validate required fields
    if (!customerId || !orderItems || !Array.isArray(orderItems)) {
      throw new ValidationError('Customer ID and order items are required');
    }

    // Verify customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new NotFoundError('Customer');
    }

    // Calculate total amount from order items
    let totalAmount = 0;
    const itemsWithPrices = [];
    
    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId}`);
      }
      const itemTotal = product.price * (item.quantity || 1);
      totalAmount += itemTotal;
      itemsWithPrices.push({
        productId: item.productId,
        quantity: item.quantity || 1,
        pricePerUnit: product.price,
      });
    }

    // Calculate final amount with discount and tax
    const discount = discountAmount || 0;
    const tax = taxAmount || 0;
    const finalAmount = totalAmount - discount + tax;

    // Get authenticated user ID (default to 1 if not available)
    const userId = req.user?.userId || 1;

    // Create order
    const order = await Order.create({
      customerId,
      orderDate: new Date(),
      totalAmount,
      discountAmount: discount,
      taxAmount: tax,
      finalAmount,
      createdByUserId: userId,
    });

    // Create order items with calculated prices
    for (const item of itemsWithPrices) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
      });
    }

    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
      ],
    });

    res.status(201).json({
      success: true,
      data: { order: createdOrder },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get list of all orders
 *     description: |
 *       Paginated list with optional basic search (`q`) on order id (numeric) and linked customer name/code,
 *       and advanced filters (customer, date range, amount range).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search — order id (if numeric) or customer first/last name, company, customer code
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         description: Advanced filter — restrict to a customer
 *         schema:
 *           type: integer
 *       - in: query
 *         name: orderDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: orderDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minFinalAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxFinalAmount
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
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           customerId:
 *                             type: integer
 *                           orderDate:
 *                             type: string
 *                             format: date-time
 *                           totalAmount:
 *                             type: number
 *                           discountAmount:
 *                             type: number
 *                           taxAmount:
 *                             type: number
 *                           finalAmount:
 *                             type: number
 *                           customer:
 *                             type: object
 *                           orderItems:
 *                             type: array
 *                             items:
 *                               type: object
 *                     pagination:
 *                       type: object
 */
export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { customerId, orderDateFrom, orderDateTo, minFinalAmount, maxFinalAmount } = req.query;

    const baseFilters: Record<string, unknown> = {};
    if (customerId !== undefined && customerId !== '') {
      baseFilters.customerId = Number(customerId);
    }

    const dr = dateRangeOnField('orderDate', orderDateFrom as string | undefined, orderDateTo as string | undefined);
    if (dr) Object.assign(baseFilters, dr);

    const amt: Record<string | symbol, number> = {};
    if (minFinalAmount !== undefined && minFinalAmount !== '') {
      const n = Number(minFinalAmount);
      if (!Number.isNaN(n)) amt[Op.gte] = n;
    }
    if (maxFinalAmount !== undefined && maxFinalAmount !== '') {
      const n = Number(maxFinalAmount);
      if (!Number.isNaN(n)) amt[Op.lte] = n;
    }
    if (Object.keys(amt).length > 0) {
      baseFilters.finalAmount = amt;
    }

    let where: Record<string, unknown> = baseFilters;

    if (q) {
      const pattern = wrapIlike(q);
      const searchOr: Record<string, unknown>[] = [
        { '$customer.firstName$': { [Op.iLike]: pattern } },
        { '$customer.lastName$': { [Op.iLike]: pattern } },
        { '$customer.companyName$': { [Op.iLike]: pattern } },
        { '$customer.customerCode$': { [Op.iLike]: pattern } },
      ];
      if (isDigitsOnly(q)) {
        const id = parseInt(q, 10);
        if (id > 0) searchOr.push({ id });
      }
      where = {
        [Op.and]: [baseFilters, { [Op.or]: searchOr }],
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      subQuery: false,
      distinct: true,
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems' },
      ],
      order: [['orderDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        orders: rows,
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
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieves a single order with full details including customer, order items, and products.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         customerId:
 *                           type: integer
 *                         orderDate:
 *                           type: string
 *                           format: date-time
 *                         totalAmount:
 *                           type: number
 *                         discountAmount:
 *                           type: number
 *                         taxAmount:
 *                           type: number
 *                         finalAmount:
 *                           type: number
 *                         customer:
 *                           type: object
 *                         orderItems:
 *                           type: array
 *                           items:
 *                             type: object
 *       404:
 *         description: Order not found
 */
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems', include: [{ model: Product, as: 'product' }] },
      ],
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

