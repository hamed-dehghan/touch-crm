import { Op } from 'sequelize';
import sequelize from '../config/database';
import Customer from '../models/Customer';
import MessageQueue, { MessageStatus } from '../models/MessageQueue';
import Order from '../models/Order';
import CustomerLevel from '../models/CustomerLevel';

/**
 * Send birthday messages to customers
 */
export const sendBirthdayMessages = async (): Promise<number> => {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate();

  // Find customers with birthday today
  const customers = await Customer.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM birth_date')), month),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('DAY FROM birth_date')), day),
      ],
    },
    include: [
      {
        model: CustomerLevel,
        as: 'customerLevel',
        attributes: ['levelName'],
        required: false,
      },
    ],
  });

  if (customers.length === 0) {
    return 0;
  }

  const messageTemplate = '🎉 Happy Birthday [FirstName]! We wish you a wonderful day filled with joy. Thank you for being a valued [Level] member!';

  const messages = customers.map((customer: any) => {
    let message = messageTemplate;
    message = message.replace(/\[FirstName\]/g, customer.firstName || 'Valued Customer');
    message = message.replace(/\[Level\]/g, customer.customerLevel?.levelName || 'member');

    return {
      customerId: customer.id,
      phoneNumber: customer.phoneNumber,
      messageText: message,
      status: MessageStatus.PENDING,
      scheduledFor: new Date(),
      retryCount: 0,
    };
  });

  await MessageQueue.bulkCreate(messages);

  return customers.length;
};

/**
 * Send inactivity notifications
 */
export const sendInactivityMessages = async (daysInactive: number = 60): Promise<number> => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysInactive);

  // Find customers with no orders in the last X days
  const customersWithRecentOrders = await Order.findAll({
    attributes: ['customerId'],
    where: {
      orderDate: { [Op.gte]: dateThreshold },
    },
    group: ['customerId'],
    raw: true,
  });

  const customerIdsWithRecentOrders = customersWithRecentOrders.map((o: any) => o.customerId);

  const inactiveCustomers = await Customer.findAll({
    where: {
      id: { [Op.notIn]: customerIdsWithRecentOrders },
      status: 'CUSTOMER', // Only active customers
    },
    include: [
      {
        model: CustomerLevel,
        as: 'customerLevel',
        attributes: ['levelName'],
        required: false,
      },
    ],
  });

  if (inactiveCustomers.length === 0) {
    return 0;
  }

  const messageTemplate = `Hi [FirstName], we miss you! It's been a while since your last purchase. Check out our latest offers and come back soon!`;

  const messages = inactiveCustomers.map((customer) => {
    let message = messageTemplate;
    message = message.replace(/\[FirstName\]/g, customer.firstName || 'Valued Customer');

    return {
      customerId: customer.id,
      phoneNumber: customer.phoneNumber,
      messageText: message,
      status: MessageStatus.PENDING,
      scheduledFor: new Date(),
      retryCount: 0,
    };
  });

  await MessageQueue.bulkCreate(messages);

  return inactiveCustomers.length;
};

/**
 * Send welcome message to new customer
 */
export const sendWelcomeMessage = async (customerId: number): Promise<void> => {
  const customer = await Customer.findByPk(customerId, {
    include: [
      {
        model: CustomerLevel,
        as: 'customerLevel',
        attributes: ['levelName'],
        required: false,
      },
    ],
  });

  if (!customer) {
    return;
  }

  const messageTemplate = `Welcome [FirstName]! Thank you for joining us. We're excited to have you as a [Level] member!`;

  let message = messageTemplate;
  message = message.replace(/\[FirstName\]/g, customer.firstName || 'Valued Customer');
  message = message.replace(/\[Level\]/g, (customer as any).customerLevel?.levelName || 'valued');

  await MessageQueue.create({
    customerId: customer.id,
    phoneNumber: customer.phoneNumber,
    messageText: message,
    status: MessageStatus.PENDING,
    scheduledFor: new Date(),
    retryCount: 0,
  });
};
