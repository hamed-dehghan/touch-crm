import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Customer from '../models/Customer.js';
import CustomerPhone from '../models/CustomerPhone.js';
import MessageQueue, { MessageStatus } from '../models/MessageQueue.js';
import Order from '../models/Order.js';
import CustomerLevel from '../models/CustomerLevel.js';

/**
 * Helper: get the default phone number for a customer
 */
const getDefaultPhone = async (customerId: number): Promise<string | null> => {
  // First try to find a default phone
  let phone = await CustomerPhone.findOne({
    where: { customerId, isDefault: true },
    attributes: ['phoneNumber'],
  });

  // Fallback to first phone
  if (!phone) {
    phone = await CustomerPhone.findOne({
      where: { customerId },
      attributes: ['phoneNumber'],
      order: [['id', 'ASC']],
    });
  }

  return phone?.phoneNumber ?? null;
};

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
      isActive: true,
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
      {
        model: CustomerPhone,
        as: 'phones',
        where: { isDefault: true },
        required: false,
      },
    ],
  });

  if (customers.length === 0) {
    return 0;
  }

  const messageTemplate = '🎉 Happy Birthday [FirstName]! We wish you a wonderful day filled with joy. Thank you for being a valued [Level] member!';

  const messages: any[] = [];
  for (const customer of customers) {
    const phones = (customer as any).phones as CustomerPhone[];
    const phoneNumber = phones?.[0]?.phoneNumber ?? await getDefaultPhone(customer.id);
    if (!phoneNumber) continue; // skip if no phone number

    let message = messageTemplate;
    message = message.replace(/\[FirstName\]/g, customer.firstName || 'Valued Customer');
    message = message.replace(/\[Level\]/g, (customer as any).customerLevel?.levelName || 'member');

    messages.push({
      customerId: customer.id,
      phoneNumber,
      messageText: message,
      status: MessageStatus.PENDING,
      scheduledFor: new Date(),
      retryCount: 0,
    });
  }

  if (messages.length > 0) {
    await MessageQueue.bulkCreate(messages);
  }

  return messages.length;
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
      status: 'CUSTOMER',
      isActive: true,
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

  const messages: any[] = [];
  for (const customer of inactiveCustomers) {
    const phoneNumber = await getDefaultPhone(customer.id);
    if (!phoneNumber) continue;

    let message = messageTemplate;
    message = message.replace(/\[FirstName\]/g, customer.firstName || 'Valued Customer');

    messages.push({
      customerId: customer.id,
      phoneNumber,
      messageText: message,
      status: MessageStatus.PENDING,
      scheduledFor: new Date(),
      retryCount: 0,
    });
  }

  if (messages.length > 0) {
    await MessageQueue.bulkCreate(messages);
  }

  return messages.length;
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

  const phoneNumber = await getDefaultPhone(customerId);
  if (!phoneNumber) return;

  const messageTemplate = `Welcome [FirstName]! Thank you for joining us. We're excited to have you as a [Level] member!`;

  let message = messageTemplate;
  message = message.replace(/\[FirstName\]/g, customer.firstName || 'Valued Customer');
  message = message.replace(/\[Level\]/g, (customer as any).customerLevel?.levelName || 'valued');

  await MessageQueue.create({
    customerId: customer.id,
    phoneNumber,
    messageText: message,
    status: MessageStatus.PENDING,
    scheduledFor: new Date(),
    retryCount: 0,
  });
};
