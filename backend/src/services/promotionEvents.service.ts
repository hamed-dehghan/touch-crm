import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Promotion from '../models/Promotion.js';
import CustomerPromotion from '../models/CustomerPromotion.js';

/**
 * Promotion Events Service
 * 
 * Automatically triggers and assigns promotions based on customer actions:
 * - First purchase (welcome bonus)
 * - Minimum purchase threshold reached
 * - Customer level upgrade
 * - Successful referral
 * 
 * Promotions are assigned to customers and can be redeemed on future orders.
 */

/**
 * Check and assign promotions after order creation
 * 
 * Evaluates all active promotions to see if customer qualifies based on:
 * - Being their first order
 * - Meeting minimum purchase amount
 * 
 * @param customerId - The ID of the customer who placed the order
 * @param orderTotal - The total amount of the order
 */
export const checkPromotionsAfterOrder = async (customerId: number, orderTotal: number): Promise<void> => {
  // Get all active promotions
  const activePromotions = await Promotion.findAll({
    where: { isActive: true },
  });

  for (const promotion of activePromotions) {
    try {
      const condition = JSON.parse(promotion.conditionJson);

      // Check first_purchase condition
      if (condition.type === 'first_purchase') {
        const orderCount = await Order.count({ where: { customerId } });
        if (orderCount === 1) {
          // This is the first order, assign promotion
          await assignPromotionToCustomer(customerId, promotion.id);
        }
      }

      // Check minimum_purchase condition
      if (condition.type === 'minimum_purchase' && condition.amount) {
        if (orderTotal >= condition.amount) {
          // Check if promotion already assigned
          const existing = await CustomerPromotion.findOne({
            where: { customerId, promotionId: promotion.id, isUsed: false },
          });

          if (!existing) {
            await assignPromotionToCustomer(customerId, promotion.id);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking promotion ${promotion.id} for customer ${customerId}:`, error);
    }
  }
};

/**
 * Check and assign promotions after customer level change
 */
export const checkPromotionsAfterLevelChange = async (customerId: number): Promise<void> => {
  const customer = await Customer.findByPk(customerId);

  if (!customer || !customer.customerLevelId) {
    return;
  }

  // Get all active promotions
  const activePromotions = await Promotion.findAll({
    where: { isActive: true },
  });

  for (const promotion of activePromotions) {
    try {
      const condition = JSON.parse(promotion.conditionJson);

      // Check customer_level condition
      if (condition.type === 'customer_level' && condition.level_id) {
        if (customer.customerLevelId === condition.level_id) {
          // Check if promotion already assigned
          const existing = await CustomerPromotion.findOne({
            where: { customerId, promotionId: promotion.id, isUsed: false },
          });

          if (!existing) {
            await assignPromotionToCustomer(customerId, promotion.id);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking promotion ${promotion.id} for customer ${customerId}:`, error);
    }
  }
};

/**
 * Check and assign promotions for referred customers
 */
export const checkPromotionsForReferral = async (customerId: number): Promise<void> => {
  const customer = await Customer.findByPk(customerId);

  if (!customer || !customer.referredByCustomerId) {
    return;
  }

  // Get all active promotions
  const activePromotions = await Promotion.findAll({
    where: { isActive: true },
  });

  for (const promotion of activePromotions) {
    try {
      const condition = JSON.parse(promotion.conditionJson);

      // Check referral condition
      if (condition.type === 'referral') {
        // Check if promotion already assigned
        const existing = await CustomerPromotion.findOne({
          where: { customerId, promotionId: promotion.id, isUsed: false },
        });

        if (!existing) {
          await assignPromotionToCustomer(customerId, promotion.id);
        }
      }
    } catch (error) {
      console.error(`Error checking referral promotion for customer ${customerId}:`, error);
    }
  }
};

/**
 * Assign promotion to customer with expiry date calculation
 */
const assignPromotionToCustomer = async (customerId: number, promotionId: number): Promise<void> => {
  const promotion = await Promotion.findByPk(promotionId);

  if (!promotion) {
    return;
  }

  // Calculate expiry date if duration is specified
  let expiryDate: Date | undefined;
  if (promotion.durationDays) {
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + promotion.durationDays);
  }

  await CustomerPromotion.create({
    customerId,
    promotionId,
    assignedAt: new Date(),
    expiryDate,
    isUsed: false,
  });

  console.log(`Promotion ${promotionId} assigned to customer ${customerId}`);
};
