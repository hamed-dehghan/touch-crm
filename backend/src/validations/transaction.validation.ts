import * as yup from 'yup';
import { PaymentMethod } from '../models/Transaction';

export const createTransactionSchema = yup.object({
  customerId: yup.number().required('Customer ID is required').positive().integer(),
  orderId: yup.number().nullable().positive().integer(),
  paymentMethod: yup
    .string()
    .oneOf(Object.values(PaymentMethod) as string[], 'Invalid payment method')
    .required('Payment method is required'),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .test('decimal', 'Amount must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),
  transactionDate: yup.date().required('Transaction date is required'),
});
