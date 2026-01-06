import { Op } from 'sequelize';
import Campaign, { CampaignStatus } from '../models/Campaign';
import Customer from '../models/Customer';
import CustomerLevel from '../models/CustomerLevel';
import MessageQueue, { MessageStatus } from '../models/MessageQueue';
import Order from '../models/Order';

/**
 * Campaign Service
 * 
 * Handles SMS/marketing campaign execution with dynamic customer filtering.
 * Supports targeting customers by:
 * - Customer level/tier
 * - Last purchase date
 * - Customer status
 * 
 * Messages are queued for batch processing to avoid overwhelming SMS provider.
 */

interface FilterConditions {
  level?: string;
  last_purchase_days_ago?: string;
  status?: string;
}

/**
 * Parse filter conditions and build Sequelize query
 */
const buildCustomerQuery = async (filterConditionsJson: string) => {
  try {
    const filters: FilterConditions = JSON.parse(filterConditionsJson);
    const where: any = {};
    const include: any[] = [];

    // Level filter
    if (filters.level) {
      include.push({
        model: CustomerLevel,
        as: 'customerLevel',
        where: { levelName: filters.level },
        required: true,
      });
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Last purchase days ago filter
    if (filters.last_purchase_days_ago) {
      const daysAgo = parseInt(filters.last_purchase_days_ago.replace(/\D/g, ''));
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

      // Find customers with no orders or last order before threshold
      const customersWithRecentOrders = await Order.findAll({
        attributes: ['customerId'],
        where: {
          orderDate: { [Op.gte]: dateThreshold },
        },
        group: ['customerId'],
        raw: true,
      });

      const customerIdsWithRecentOrders = customersWithRecentOrders.map(
        (o: any) => o.customerId
      );

      if (filters.last_purchase_days_ago.startsWith('>')) {
        // Customers with no orders in X+ days
        where.id = { [Op.notIn]: customerIdsWithRecentOrders };
      } else if (filters.last_purchase_days_ago.startsWith('<')) {
        // Customers with orders in last X days
        where.id = { [Op.in]: customerIdsWithRecentOrders };
      }
    }

    return { where, include };
  } catch (error) {
    console.error('Error parsing filter conditions:', error);
    return { where: {}, include: [] };
  }
};

/**
 * Render message template with customer data
 */
const renderMessageTemplate = (template: string, customer: Customer): string => {
  let message = template;
  message = message.replace(/\[FirstName\]/g, customer.firstName || '');
  message = message.replace(/\[LastName\]/g, customer.lastName || '');
  message = message.replace(/\[FullName\]/g, `${customer.firstName || ''} ${customer.lastName}`.trim());
  message = message.replace(/\[PhoneNumber\]/g, customer.phoneNumber || '');
  message = message.replace(/\[Email\]/g, customer.email || '');

  // Get customer level name if available
  if ((customer as any).customerLevel) {
    message = message.replace(/\[Level\]/g, (customer as any).customerLevel.levelName);
  }

  return message;
};

/**
 * Execute a campaign - filter customers and populate message queue
 */
export const executeCampaign = async (campaignId: number): Promise<number> => {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [{ model: CustomerLevel, as: 'customerLevel' }],
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === CampaignStatus.SENT) {
    throw new Error('Campaign has already been sent');
  }

  // Build customer query from filter conditions
  const { where, include } = await buildCustomerQuery(
    campaign.filterConditionsJson || '{}'
  );

  // Fetch matching customers
  const customers = await Customer.findAll({
    where,
    include: [
      ...include,
      {
        model: CustomerLevel,
        as: 'customerLevel',
        attributes: ['id', 'levelName'],
        required: false,
      },
    ],
  });

  if (customers.length === 0) {
    throw new Error('No customers match the campaign filters');
  }

  // Create message queue entries
  const messageQueueEntries = customers.map((customer) => ({
    customerId: customer.id,
    phoneNumber: customer.phoneNumber,
    messageText: renderMessageTemplate(campaign.messageTemplate, customer),
    status: MessageStatus.PENDING,
    scheduledFor: campaign.scheduledSendTime || new Date(),
    retryCount: 0,
  }));

  await MessageQueue.bulkCreate(messageQueueEntries);

  // Update campaign status
  await campaign.update({
    status: CampaignStatus.SENT,
  });

  return customers.length;
};
