import * as yup from 'yup';
import { CustomerStatus, CustomerType } from '';

export const createCustomerSchema = yup.object().shape({
  firstName: yup.string().max(100),
  lastName: yup.string().max(100).required('Last name is required'),
  phoneNumber: yup.string().max(15).required('Phone number is required'),
  email: yup.string().email('Invalid email format').max(150),
  birthDate: yup.date(),
  status: yup.string().oneOf(Object.values(CustomerStatus)),
  customerType: yup.string().oneOf(Object.values(CustomerType)),
  companyName: yup.string().max(255),
  address: yup.string(),
  website: yup.string().url('Invalid URL format').max(255),
  customerLevelId: yup.number().integer().positive(),
  referredByCustomerId: yup.number().integer().positive(),
});

export const updateCustomerSchema = yup.object().shape({
  firstName: yup.string().max(100),
  lastName: yup.string().max(100),
  phoneNumber: yup.string().max(15),
  email: yup.string().email('Invalid email format').max(150),
  birthDate: yup.date(),
  status: yup.string().oneOf(Object.values(CustomerStatus)),
  customerType: yup.string().oneOf(Object.values(CustomerType)),
  companyName: yup.string().max(255),
  address: yup.string(),
  website: yup.string().url('Invalid URL format').max(255),
  customerLevelId: yup.number().integer().positive(),
  referredByCustomerId: yup.number().integer().positive(),
});
