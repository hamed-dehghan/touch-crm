/**
 * Mock database: in-memory data following PostgreSQL schema from migrations.
 * Schema reference: backend/src/migrations/*.js
 */

import type {
  Role,
  Permission,
  User,
  CustomerLevel,
  Customer,
  Product,
  Order,
  OrderItem,
  Transaction,
  Promotion,
  CustomerPromotion,
  Campaign,
} from '@/types/api';

let nextId = {
  role: 4,
  permission: 50,
  user: 3,
  customerLevel: 5,
  customer: 20,
  product: 15,
  order: 25,
  orderItem: 50,
  transaction: 20,
  promotion: 10,
  customerPromotion: 15,
  campaign: 5,
};

export const roles: Role[] = [
  { id: 1, roleName: 'Sales Representative', description: 'Front-line staff', createdAt: '', updatedAt: '' },
  { id: 2, roleName: 'Sales Manager', description: 'Team supervision', createdAt: '', updatedAt: '' },
  { id: 3, roleName: 'Administrator', description: 'Full system access', createdAt: '', updatedAt: '' },
];

export const permissions: Permission[] = [
  { id: 1, actionCode: 'customers:create', resource: 'customers', description: 'Create customers', createdAt: '' },
  { id: 2, actionCode: 'customers:read_all', resource: 'customers', description: 'View all customers', createdAt: '' },
  { id: 3, actionCode: 'orders:create', resource: 'orders', description: 'Create orders', createdAt: '' },
  { id: 4, actionCode: 'orders:read', resource: 'orders', description: 'View orders', createdAt: '' },
  { id: 5, actionCode: 'roles:manage', resource: 'roles', description: 'Manage roles', createdAt: '' },
  { id: 6, actionCode: 'promotions:create', resource: 'promotions', description: 'Create promotions', createdAt: '' },
  { id: 7, actionCode: 'campaigns:create', resource: 'campaigns', description: 'Create campaigns', createdAt: '' },
  { id: 8, actionCode: 'campaigns:execute', resource: 'campaigns', description: 'Execute campaigns', createdAt: '' },
];

export const users: User[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'مدیر سیستم',
    email: 'admin@example.com',
    roleId: 3,
    isActive: true,
    createdAt: '',
    role: roles[2],
  },
  {
    id: 2,
    username: 'manager1',
    fullName: 'مدیر فروش',
    email: 'manager@example.com',
    roleId: 2,
    isActive: true,
    createdAt: '',
    role: roles[1],
  },
];

export const customerLevels: CustomerLevel[] = [
  { id: 1, levelName: 'Bronze', minScore: 1.0, maxScore: 2.5, createdAt: '', updatedAt: '' },
  { id: 2, levelName: 'Silver', minScore: 2.6, maxScore: 3.5, createdAt: '', updatedAt: '' },
  { id: 3, levelName: 'Gold', minScore: 3.6, maxScore: 4.5, createdAt: '', updatedAt: '' },
  { id: 4, levelName: 'Platinum', minScore: 4.6, maxScore: 5.0, createdAt: '', updatedAt: '' },
];

export const customers: Customer[] = [
  {
    id: 1,
    firstName: 'علی',
    lastName: 'محمدی',
    phoneNumber: '09121234567',
    email: 'ali@example.com',
    birthDate: '1370-05-15',
    status: 'CUSTOMER',
    customerType: 'PERSON',
    customerLevelId: 3,
    createdAt: '',
    updatedAt: '',
    customerLevel: customerLevels[2],
  },
  {
    id: 2,
    firstName: 'مریم',
    lastName: 'رضایی',
    phoneNumber: '09129876543',
    birthDate: '1368-10-01',
    status: 'CUSTOMER',
    customerType: 'PERSON',
    customerLevelId: 2,
    referredByCustomerId: 1,
    createdAt: '',
    updatedAt: '',
    customerLevel: customerLevels[1],
  },
  {
    id: 3,
    firstName: 'حسین',
    lastName: 'احمدی',
    phoneNumber: '09131112222',
    status: 'LEAD',
    customerType: 'PERSON',
    createdAt: '',
    updatedAt: '',
  },
];

export const products: Product[] = [
  { id: 1, productName: 'محصول الف', price: 100000, taxRate: 9, createdAt: '', updatedAt: '' },
  { id: 2, productName: 'محصول ب', price: 250000, taxRate: 9, createdAt: '', updatedAt: '' },
  { id: 3, productName: 'محصول ج', price: 50000, taxRate: 0, createdAt: '', updatedAt: '' },
];

export const orders: Order[] = [
  {
    id: 1,
    customerId: 1,
    orderDate: new Date().toISOString(),
    totalAmount: 350000,
    discountAmount: 0,
    taxAmount: 31500,
    finalAmount: 381500,
    createdByUserId: 1,
    createdAt: '',
    updatedAt: '',
    customer: customers[0],
    orderItems: [
      { id: 1, orderId: 1, productId: 1, quantity: 2, pricePerUnit: 100000, product: products[0] },
      { id: 2, orderId: 1, productId: 2, quantity: 1, pricePerUnit: 250000, product: products[1] },
    ],
  },
  {
    id: 2,
    customerId: 2,
    orderDate: new Date().toISOString(),
    totalAmount: 100000,
    discountAmount: 10000,
    taxAmount: 8100,
    finalAmount: 98100,
    createdByUserId: 1,
    createdAt: '',
    updatedAt: '',
    customer: customers[1],
    orderItems: [
      { id: 3, orderId: 2, productId: 1, quantity: 1, pricePerUnit: 100000, product: products[0] },
    ],
  },
];

export const orderItems: OrderItem[] = orders.flatMap((o) => o.orderItems || []);

export const transactions: Transaction[] = [
  {
    id: 1,
    orderId: 1,
    customerId: 1,
    paymentMethod: 'CASH',
    amount: 381500,
    transactionDate: new Date().toISOString().slice(0, 10),
    createdAt: '',
    updatedAt: '',
    customer: customers[0],
    order: orders[0],
  },
];

export const promotions: Promotion[] = [
  {
    id: 1,
    title: 'تخفیف یلدا',
    rewardType: 'PERCENTAGE',
    rewardValue: 10,
    conditionJson: JSON.stringify({ type: 'first_purchase' }),
    durationDays: 30,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    title: 'هدیه معرفی',
    rewardType: 'FIXED_AMOUNT',
    rewardValue: 50000,
    conditionJson: JSON.stringify({ type: 'referral' }),
    durationDays: 14,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

export const customerPromotions: CustomerPromotion[] = [
  {
    id: 1,
    customerId: 2,
    promotionId: 2,
    assignedAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    isUsed: false,
    createdAt: '',
    updatedAt: '',
    promotion: promotions[1],
  },
];

export const campaigns: Campaign[] = [
  {
    id: 1,
    name: 'کمپین یلدا',
    messageTemplate: 'سلام [FirstName]! تخفیف ویژه یلدا برای شما.',
    filterConditionsJson: JSON.stringify({ status: 'CUSTOMER' }),
    status: 'DRAFT',
    createdByUserId: 1,
    createdAt: '',
    updatedAt: '',
    createdBy: users[0],
  },
];

export function getNextId(key: keyof typeof nextId): number {
  return nextId[key]++;
}

export function resetNextIds() {
  nextId = {
    role: 4,
    permission: 50,
    user: 3,
    customerLevel: 5,
    customer: 20,
    product: 15,
    order: 25,
    orderItem: 50,
    transaction: 20,
    promotion: 10,
    customerPromotion: 15,
    campaign: 5,
  };
}
