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
  Task,
  Project,
  WorkLog,
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
  task: 5,
  project: 4,
  workLog: 4,
  rolePermission: 20,
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
    customerCode: 'C-00001',
    customerType: 'NATURAL',
    firstName: 'علی',
    lastName: 'محمدی',
    isActive: true,
    prefix: 'جناب آقای',
    gender: 'MALE',
    email: 'ali@example.com',
    birthDate: '1370-05-15',
    status: 'CUSTOMER',
    relationshipType: 'CUSTOMER',
    acquisitionChannel: 'WEBSITE',
    customerLevelId: 3,
    interests: 'تکنولوژی، کتابخوانی',
    createdAt: '',
    updatedAt: '',
    customerLevel: customerLevels[2],
    phones: [
      { id: 1, customerId: 1, phoneNumber: '09121234567', phoneType: 'MOBILE', isDefault: true },
      { id: 2, customerId: 1, phoneNumber: '02188776655', phoneType: 'LANDLINE', extension: '102', isDefault: false },
    ],
    addresses: [
      { id: 1, customerId: 1, province: 'تهران', city: 'تهران', address: 'خیابان ولیعصر، پلاک ۱۲', postalCode: '1234567890', isDefault: true },
    ],
    socialMedia: [
      { id: 1, customerId: 1, platform: 'INSTAGRAM', profileUrl: 'https://instagram.com/ali_m' },
    ],
  },
  {
    id: 2,
    customerCode: 'C-00002',
    customerType: 'NATURAL',
    firstName: 'مریم',
    lastName: 'رضایی',
    isActive: true,
    gender: 'FEMALE',
    prefix: 'سرکار خانم',
    birthDate: '1368-10-01',
    status: 'CUSTOMER',
    relationshipType: 'CUSTOMER',
    acquisitionChannel: 'REFERRAL',
    customerLevelId: 2,
    referredByCustomerId: 1,
    createdAt: '',
    updatedAt: '',
    customerLevel: customerLevels[1],
    phones: [
      { id: 3, customerId: 2, phoneNumber: '09129876543', phoneType: 'MOBILE', isDefault: true },
    ],
  },
  {
    id: 3,
    customerCode: 'C-00003',
    customerType: 'NATURAL',
    firstName: 'حسین',
    lastName: 'احمدی',
    isActive: true,
    status: 'LEAD',
    relationshipType: 'CUSTOMER',
    createdAt: '',
    updatedAt: '',
    phones: [
      { id: 4, customerId: 3, phoneNumber: '09131112222', phoneType: 'MOBILE', isDefault: true },
    ],
  },
  {
    id: 4,
    customerCode: 'C-00004',
    customerType: 'LEGAL',
    companyName: 'اطلس دینا',
    brandName: 'چیتوز',
    isActive: true,
    status: 'CUSTOMER',
    relationshipType: 'CUSTOMER',
    acquisitionChannel: 'EXHIBITION',
    customerLevelId: 3,
    createdAt: '',
    updatedAt: '',
    customerLevel: customerLevels[2],
    phones: [
      { id: 5, customerId: 4, phoneNumber: '02144556677', phoneType: 'LANDLINE', extension: '200', isDefault: true },
      { id: 6, customerId: 4, phoneNumber: '09151234567', phoneType: 'MOBILE', isDefault: false },
    ],
    addresses: [
      { id: 2, customerId: 4, province: 'تهران', city: 'تهران', address: 'شهرک صنعتی غرب، فاز ۲', postalCode: '1357924680', isDefault: true },
    ],
    relatedPersonnel: [
      { id: 1, legalCustomerId: 4, naturalCustomerId: 1, position: 'مدیر عامل', naturalCustomer: { id: 1, firstName: 'علی', lastName: 'محمدی', customerCode: 'C-00001' } },
    ],
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

/* ── Role-Permission assignments (mock RBAC) ── */
export const rolePermissions: { roleId: number; permissionId: number }[] = [
  // Admin has all permissions
  ...permissions.map((p) => ({ roleId: 3, permissionId: p.id })),
  // Sales Manager
  { roleId: 2, permissionId: 1 },
  { roleId: 2, permissionId: 2 },
  { roleId: 2, permissionId: 3 },
  { roleId: 2, permissionId: 4 },
  { roleId: 2, permissionId: 6 },
  // Sales Rep
  { roleId: 1, permissionId: 1 },
  { roleId: 1, permissionId: 3 },
  { roleId: 1, permissionId: 4 },
];

/* ── Projects ── */
export const projects: Project[] = [
  {
    id: 1,
    projectName: 'پروژه استقرار نرم‌افزار',
    customerId: 1,
    status: 'IN_PROGRESS',
    description: 'استقرار و پیکربندی نرم‌افزار',
    createdAt: '',
    updatedAt: '',
    customer: { id: 1, firstName: 'علی', lastName: 'محمدی' },
  },
  {
    id: 2,
    projectName: 'مشاوره فروش',
    customerId: 2,
    status: 'OPEN',
    description: 'ارائه مشاوره فروش به مشتری',
    createdAt: '',
    updatedAt: '',
    customer: { id: 2, firstName: 'مریم', lastName: 'رضایی' },
  },
  {
    id: 3,
    projectName: 'طراحی وب‌سایت',
    customerId: 3,
    status: 'OPEN',
    createdAt: '',
    updatedAt: '',
    customer: { id: 3, firstName: 'حسین', lastName: 'احمدی' },
  },
];

/* ── Tasks ── */
export const tasks: Task[] = [
  {
    id: 1,
    title: 'تماس پیگیری با مشتری',
    description: 'پیگیری سفارش قبلی',
    projectId: 1,
    assignedToUserId: 1,
    createdByUserId: 1,
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'PENDING',
    isRecurring: false,
    createdAt: '',
    updatedAt: '',
    project: { id: 1, projectName: 'پروژه استقرار نرم‌افزار' },
    assignedTo: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
    createdBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
  },
  {
    id: 2,
    title: 'ارسال پیش‌فاکتور',
    assignedToUserId: 2,
    createdByUserId: 1,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'IN_PROGRESS',
    isRecurring: false,
    createdAt: '',
    updatedAt: '',
    assignedTo: { id: 2, username: 'manager1', fullName: 'مدیر فروش' },
    createdBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
  },
  {
    id: 3,
    title: 'بررسی رضایت مشتری',
    description: 'تماس ماهانه',
    projectId: 2,
    assignedToUserId: 1,
    createdByUserId: 1,
    status: 'PENDING',
    isRecurring: true,
    recurringIntervalDays: 30,
    createdAt: '',
    updatedAt: '',
    project: { id: 2, projectName: 'مشاوره فروش' },
    assignedTo: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
    createdBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
  },
  {
    id: 4,
    title: 'جلسه دمو محصول',
    assignedToUserId: 2,
    createdByUserId: 1,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'COMPLETED',
    isRecurring: false,
    createdAt: '',
    updatedAt: '',
    assignedTo: { id: 2, username: 'manager1', fullName: 'مدیر فروش' },
    createdBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
  },
];

/* ── Work Logs ── */
export const workLogs: WorkLog[] = [
  {
    id: 1,
    userId: 1,
    customerId: 1,
    taskId: 1,
    logDate: new Date().toISOString().slice(0, 10),
    durationMinutes: 30,
    description: 'تماس تلفنی با مشتری',
    result: 'مشتری درخواست ارسال پیش‌فاکتور داشت',
    createdAt: '',
    updatedAt: '',
    loggedBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
    customer: { id: 1, firstName: 'علی', lastName: 'محمدی' },
    task: { id: 1, title: 'تماس پیگیری با مشتری' },
  },
  {
    id: 2,
    userId: 2,
    customerId: 2,
    logDate: new Date().toISOString().slice(0, 10),
    durationMinutes: 60,
    description: 'جلسه حضوری',
    result: 'توافق اولیه انجام شد',
    createdAt: '',
    updatedAt: '',
    loggedBy: { id: 2, username: 'manager1', fullName: 'مدیر فروش' },
    customer: { id: 2, firstName: 'مریم', lastName: 'رضایی' },
  },
  {
    id: 3,
    userId: 1,
    logDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    durationMinutes: 15,
    description: 'ثبت اطلاعات در سیستم',
    result: 'اطلاعات به‌روزرسانی شد',
    createdAt: '',
    updatedAt: '',
    loggedBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
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
    task: 5,
    project: 4,
    workLog: 4,
    rolePermission: 20,
  };
}
