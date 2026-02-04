import CustomerPromotion from '../models/CustomerPromotion.js';
import Promotion, { RewardType } from '../models/Promotion.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';

interface PromotionCondition {
  type: string;
  level_id?: number;
  amount?: number;
}

/**
 * Evaluate if a customer is eligible for a promotion based on conditions
 */
export const evaluatePromotionConditions = async (
  customerId: number,
  conditionJson: string
): Promise<boolean> => {
  try {
    const condition: PromotionCondition = JSON.parse(conditionJson);

    switch (condition.type) {
      case 'first_purchase':
        // Check if customer has no prior orders
        const orderCount = await Order.count({
          where: { customerId },
        });
        return orderCount === 0;

      case 'customer_level':
        // Check if customer's level matches
        if (!condition.level_id) return false;
        const customer = await Customer.findByPk(customerId);
        return customer?.customerLevelId === condition.level_id;

      case 'referral':
        // Check if customer was referred
        const referredCustomer = await Customer.findByPk(customerId);
        return referredCustomer?.referredByCustomerId !== null;

      case 'minimum_purchase':
        // This will be checked during order creation
        return true;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error evaluating promotion conditions:', error);
    return false;
  }
};

/**
 * Get the best available promotion for a customer
 */
export const getBestAvailablePromotion = async (
  customerId: number,
  orderTotal: number
): Promise<CustomerPromotion | null> => {
  // Get all unused, non-expired promotions for the customer
  const availablePromotions = await CustomerPromotion.findAll({
    where: {
      customerId,
      isUsed: false,
    },
    include: [
      {
        model: Promotion,
        as: 'promotion',
        where: { isActive: true },
      },
    ],
    order: [['assignedAt', 'DESC']],
  });

  if (availablePromotions.length === 0) {
    return null;
  }

  // Calculate discount for each promotion and return the best one
  let bestPromotion: CustomerPromotion | null = null;
  let bestDiscount = 0;

  for (const customerPromotion of availablePromotions) {
    const promotion = (customerPromotion as any).promotion;
    let discount = 0;

    if (promotion.rewardType === RewardType.PERCENTAGE) {
      discount = (orderTotal * parseFloat(promotion.rewardValue.toString())) / 100;
    } else if (promotion.rewardType === RewardType.FIXED_AMOUNT) {
      discount = parseFloat(promotion.rewardValue.toString());
    }

    // Check minimum purchase condition if applicable
    try {
      const condition: PromotionCondition = JSON.parse(promotion.conditionJson);
      if (condition.type === 'minimum_purchase' && condition.amount) {
        if (orderTotal < condition.amount) {
          continue; // Skip this promotion if minimum purchase not met
        }
      }
    } catch (error) {
      // Invalid condition JSON, skip
      continue;
    }

    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestPromotion = customerPromotion;
    }
  }

  return bestPromotion;
};

/**
 * Apply a promotion to an order and mark it as used
 */
export const applyPromotion = async (
  customerPromotionId: number,
  _orderId: number
): Promise<void> => {
  await CustomerPromotion.update(
    {
      isUsed: true,
      usedAt: new Date(),
    },
    {
      where: { id: customerPromotionId },
    }
  );
};
