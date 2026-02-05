import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

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
 *     description: Retrieves all orders with associated customer and order items, sorted by order date descending.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
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
 */
export const getOrders = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'orderItems' },
      ],
      order: [['orderDate', 'DESC']],
    });

    res.json({
      success: true,
      data: { orders },
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

