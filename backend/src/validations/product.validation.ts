import * as yup from 'yup';

export const createProductSchema = yup.object().shape({
  productName: yup.string().max(255).required('Product name is required'),
  price: yup.number().positive().required('Price is required'),
  taxRate: yup.number().min(0).max(100),
});

export const updateProductSchema = yup.object().shape({
  productName: yup.string().max(255),
  price: yup.number().positive(),
  taxRate: yup.number().min(0).max(100),
});
