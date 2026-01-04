import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object().shape({
  username: yup.string().min(3).max(100).required('Username is required'),
  password: yup.string().min(6).required('Password must be at least 6 characters'),
  fullName: yup.string().max(150),
  email: yup.string().email('Invalid email format'),
  roleId: yup.number().integer().positive().required('Role ID is required'),
});
