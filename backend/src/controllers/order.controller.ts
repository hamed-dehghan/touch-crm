import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Customer from '../models/Customer';
import Product from '../models/Product';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Create a new order with order items
 * Calculates totals, applies discounts and taxes
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

