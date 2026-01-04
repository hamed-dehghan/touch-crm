import * as yup from 'yup';

export const createOrderSchema = yup.object().shape({
  customerId: yup.number().integer().positive().required('Customer ID is required'),
  orderItems: yup
    .array()
    .of(
      yup.object().shape({
        productId: yup.number().integer().positive().required('Product ID is required'),
        quantity: yup.number().integer().positive().required('Quantity is required'),
      })
    )
    .min(1, 'At least one order item is required')
    .required('Order items are required'),
});
