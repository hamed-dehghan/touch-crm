import { Op } from 'sequelize';
import Customer from '../models/Customer';
import CustomerLevel from '../models/CustomerLevel';
import Order from '../models/Order';
import { checkPromotionsAfterLevelChange } from '';
import sequelize from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

interface RFMThresholds {
  recency: { [key: number]: number };
  frequency: { [key: number]: number };
  monetary: { [key: number]: number };
}

/**
 * Get RFM scoring thresholds from environment variables
 */
const getRFMThresholds = (): RFMThresholds => {
  return {
    recency: {
      5: parseInt(process.env.RFM_RECENCY_5 || '7', 10),
      4: parseInt(process.env.RFM_RECENCY_4 || '30', 10),
      3: parseInt(process.env.RFM_RECENCY_3 || '90', 10),
      2: parseInt(process.env.RFM_RECENCY_2 || '180', 10),
    },
    frequency: {
      5: parseInt(process.env.RFM_FREQUENCY_5 || '20', 10),
      4: parseInt(process.env.RFM_FREQUENCY_4 || '11', 10),
      3: parseInt(process.env.RFM_FREQUENCY_3 || '6', 10),
      2: parseInt(process.env.RFM_FREQUENCY_2 || '3', 10),
    },
    monetary: {
      5: parseFloat(process.env.RFM_MONETARY_5 || '10000'),
      4: parseFloat(process.env.RFM_MONETARY_4 || '5001'),
      3: parseFloat(process.env.RFM_MONETARY_3 || '1001'),
      2: parseFloat(process.env.RFM_MONETARY_2 || '501'),
    },
  };
};

/**
 * Calculate RFM score for a single metric
 */
const calculateMetricScore = (value: number, thresholds: { [key: number]: number }): number => {
  if (value >= thresholds[5]) return 5;
  if (value >= thresholds[4]) return 4;
  if (value >= thresholds[3]) return 3;
  if (value >= thresholds[2]) return 2;
  return 1;
};

/**
 * Calculate RFM scores for a customer
 */
export const calculateCustomerRFM = async (customerId: number): Promise<{
  recency: number;
  frequency: number;
  monetary: number;
  averageScore: number;
}> => {
  // Get all orders for customer
  const orders = await Order.findAll({
    where: { customerId },
    order: [['orderDate', 'DESC']],
  });

  // Calculate Recency (days since last order)
  let recencyDays = 999; // Default for customers with no orders
  if (orders.length > 0) {
    const lastOrderDate = new Date(orders[0].orderDate);
    const today = new Date();
    recencyDays = Math.floor((today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate Frequency (total order count)
  const frequency = orders.length;

  // Calculate Monetary (sum of final_amount)
  const monetary = orders.reduce((sum, order) => {
    return sum + parseFloat(order.finalAmount.toString());
  }, 0);

  // Get thresholds
  const thresholds = getRFMThresholds();

  // Score each metric (1-5)
  // Note: For recency, lower is better, so we invert the logic
  const recencyScore = recencyDays <= thresholds.recency[5] ? 5 :
    recencyDays <= thresholds.recency[4] ? 4 :
    recencyDays <= thresholds.recency[3] ? 3 :
    recencyDays <= thresholds.recency[2] ? 2 : 1;

  const frequencyScore = calculateMetricScore(frequency, thresholds.frequency);
  const monetaryScore = calculateMetricScore(monetary, thresholds.monetary);

  // Calculate average score
  const averageScore = (recencyScore + frequencyScore + monetaryScore) / 3;

  return {
    recency: recencyScore,
    frequency: frequencyScore,
    monetary: monetaryScore,
    averageScore: parseFloat(averageScore.toFixed(2)),
  };
};

/**
 * Update customer level based on RFM score
 */
export const updateCustomerLevel = async (customerId: number, averageScore: number): Promise<void> => {
  // Find matching customer level
  const customerLevel = await CustomerLevel.findOne({
    where: {
      minScore: { [Op.lte]: averageScore },
      maxScore: { [Op.gte]: averageScore },
    },
  });

  if (customerLevel) {
    const customer = await Customer.findByPk(customerId);
    const oldLevelId = customer?.customerLevelId;

    await Customer.update(
      { customerLevelId: customerLevel.id },
      { where: { id: customerId } }
    );

    // Check for promotions if level changed
    if (oldLevelId !== customerLevel.id) {
      checkPromotionsAfterLevelChange(customerId).catch((error) => {
        console.error(`Error checking promotions after level change for customer ${customerId}:`, error);
      });
    }
  }
};

/**
 * Process RFM scoring for all customers
 */
export const processAllCustomersRFM = async (): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> => {
  const customers = await Customer.findAll({
    attributes: ['id'],
  });

  let processed = 0;
  let updated = 0;
  let errors = 0;

  for (const customer of customers) {
    try {
      const rfm = await calculateCustomerRFM(customer.id);
      await updateCustomerLevel(customer.id, rfm.averageScore);
      processed++;
      updated++;
    } catch (error) {
      console.error(`Error processing RFM for customer ${customer.id}:`, error);
      errors++;
      processed++;
    }
  }

  return { processed, updated, errors };
};
