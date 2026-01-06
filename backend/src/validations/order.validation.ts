import * as yup from 'yup';

/**
 * Validation schema for creating an order
 * Ensures all required fields are present and valid
 */
export const createOrderSchema = yup.object({
  customerId: yup
    .number()
    .required('Customer ID is required')
    .positive('Customer ID must be positive')
    .integer('Customer ID must be an integer'),
  
  orderItems: yup
    .array()
    .of(
      yup.object({
        productId: yup
          .number()
          .required('Product ID is required')
          .positive('Product ID must be positive')
          .integer('Product ID must be an integer'),
        quantity: yup
          .number()
          .positive('Quantity must be positive')
          .integer('Quantity must be an integer')
          .default(1),
      })
    )
    .min(1, 'At least one order item is required')
    .required('Order items are required'),
  
  discountAmount: yup
    .number()
    .min(0, 'Discount cannot be negative')
    .default(0),
  
  taxAmount: yup
    .number()
    .min(0, 'Tax amount cannot be negative')
    .default(0),
});

/**
 * Validation schema for updating an order
 */
export const updateOrderSchema = yup.object({
  discountAmount: yup.number().min(0, 'Discount cannot be negative'),
  taxAmount: yup.number().min(0, 'Tax amount cannot be negative'),
});
