/**
 * API types aligned with backend contract and PostgreSQL schema (migrations).
 * Use camelCase to match backend JSON responses.
 */

export interface Role {
  id: number;
  roleName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: number;
  actionCode: string;
  description?: string;
  resource?: string;
  createdAt?: string;
}

export interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  roleId: number;
  isActive: boolean;
  createdAt?: string;
  role?: Role;
}

export interface CustomerLevel {
  id: number;
  levelName: string;
  minScore: number;
  maxScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerStatus = 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER';
export type CustomerType = 'PERSON' | 'COMPANY';

export interface Customer {
  id: number;
  firstName?: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  birthDate?: string;
  status: CustomerStatus;
  customerType: CustomerType;
  companyName?: string;
  address?: string;
  website?: string;
  customerLevelId?: number;
  referredByCustomerId?: number;
  createdAt?: string;
  updatedAt?: string;
  customerLevel?: CustomerLevel;
}

export interface Product {
  id: number;
  productName: string;
  price: number;
  taxRate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  pricePerUnit: number;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
}

export interface Order {
  id: number;
  customerId: number;
  orderDate: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  createdByUserId: number;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  orderItems?: OrderItem[];
}

export type PaymentMethod = 'CASH' | 'CHECK';

export interface Transaction {
  id: number;
  orderId?: number;
  customerId: number;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionDate: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  order?: Order;
}

export type RewardType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  id: number;
  title: string;
  rewardType: RewardType;
  rewardValue: number;
  conditionJson: string;
  durationDays?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerPromotion {
  id: number;
  customerId: number;
  promotionId: number;
  assignedAt: string;
  expiryDate?: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  promotion?: Promotion;
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';

export interface Campaign {
  id: number;
  name: string;
  messageTemplate: string;
  filterConditionsJson?: string;
  scheduledSendTime?: string;
  status: CampaignStatus;
  createdByUserId: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: User;
}

export interface RfmScores {
  recency: number;
  frequency: number;
  monetary: number;
  averageScore: number;
}

export interface CustomerRfmResponse {
  customerId: number;
  rfm: RfmScores;
  customerLevel: CustomerLevel | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { message: string; statusCode: number };
}
