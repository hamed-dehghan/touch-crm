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

export type CustomerStatus = 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' | 'LOST';
export type CustomerType = 'NATURAL' | 'LEGAL';
export type Gender = 'MALE' | 'FEMALE';
export type RelationshipType = 'CUSTOMER' | 'SUPPLIER' | 'AGENT' | 'COMPETITOR' | 'INTERNAL_STAFF';
export type AcquisitionChannel = 'INSTAGRAM' | 'EXHIBITION' | 'WEBSITE' | 'REFERRAL' | 'EVENT' | 'PREVIOUS_ACQUAINTANCE' | 'OTHER';
export type PhoneType = 'MOBILE' | 'LANDLINE';
export type SocialMediaPlatform = 'INSTAGRAM' | 'TELEGRAM' | 'WHATSAPP' | 'LINKEDIN' | 'TWITTER' | 'OTHER';

/* ── Customer child records ── */

export interface CustomerPhone {
  id?: number;
  customerId?: number;
  phoneNumber: string;
  phoneType: PhoneType;
  label?: string;
  extension?: string;
  isDefault: boolean;
}

export interface CustomerAddress {
  id?: number;
  customerId?: number;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface CustomerSocialMedia {
  id?: number;
  customerId?: number;
  platform: SocialMediaPlatform;
  profileUrl: string;
}

export interface CustomerAttachment {
  id?: number;
  customerId?: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  description?: string;
  createdAt?: string;
}

export interface CustomerRelatedPersonnel {
  id?: number;
  legalCustomerId?: number;
  naturalCustomerId: number;
  position?: string;
  naturalCustomer?: { id: number; firstName?: string; lastName?: string; customerCode: string };
}

/* ── Customer (expanded) ── */

export interface Customer {
  id: number;
  customerCode: string;
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  brandName?: string;
  isActive: boolean;
  prefix?: string;
  gender?: Gender;
  email?: string;
  website?: string;
  status: CustomerStatus;
  relationshipType: RelationshipType;
  acquisitionChannel?: AcquisitionChannel;
  customerLevelId?: number;
  referredByCustomerId?: number;
  interests?: string;
  psychology?: string;
  catchphrases?: string;
  notablePoints?: string;
  birthDate?: string;
  weddingAnniversary?: string;
  profileImageUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  customerLevel?: CustomerLevel;
  phones?: CustomerPhone[];
  addresses?: CustomerAddress[];
  socialMedia?: CustomerSocialMedia[];
  attachments?: CustomerAttachment[];
  relatedPersonnel?: CustomerRelatedPersonnel[];
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

/* ── Task ── */
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  customerId?: number;
  projectId?: number;
  assignedToUserId: number;
  createdByUserId: number;
  dueDate?: string;
  dueTime?: string;
  reminderDaysBefore?: number;
  status: TaskStatus;
  isRecurring: boolean;
  recurringIntervalDays?: number;
  recurringStartDate?: string;
  recurringEndDate?: string;
  lastTriggeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: { id: number; firstName?: string; lastName?: string; companyName?: string };
  project?: { id: number; projectName: string };
  assignedTo?: { id: number; username: string; fullName?: string };
  createdBy?: { id: number; username: string; fullName?: string };
  attachments?: TaskAttachment[];
}

/* ── Project ── */
export type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: number;
  projectName: string;
  customerId: number;
  status: ProjectStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: { id: number; firstName?: string; lastName?: string };
}

/* ── WorkLog ── */
export interface WorkLog {
  id: number;
  userId: number;
  customerId?: number;
  taskId?: number;
  logDate: string;
  durationMinutes?: number;
  description: string;
  result: string;
  createdAt?: string;
  updatedAt?: string;
  loggedBy?: { id: number; username: string; fullName?: string };
  customer?: { id: number; firstName?: string; lastName?: string };
  task?: { id: number; title: string };
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
