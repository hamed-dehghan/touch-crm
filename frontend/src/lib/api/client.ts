/**
 * API client contract — matches backend API contract.
 * Implementations: mock (default) or real (swap when backend is ready).
 */

import type {
  ApiResponse,
  Pagination,
  User,
  Customer,
  CustomerLevel,
  CustomerRfmResponse,
  Product,
  Order,
  Transaction,
  Promotion,
  CustomerPromotion,
  Campaign,
} from '@/types/api';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: number;
  orderId?: number;
}

export interface AuthApi {
  login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>>;
  getMe(): Promise<ApiResponse<{ user: User }>>;
}

export interface CustomersApi {
  list(params?: ListParams): Promise<ApiResponse<{ customers: Customer[]; pagination: Pagination }>>;
  getById(id: number): Promise<ApiResponse<{ customer: Customer }>>;
  create(body: Partial<Customer>): Promise<ApiResponse<{ customer: Customer }>>;
  update(id: number, body: Partial<Customer>): Promise<ApiResponse<{ customer: Customer }>>;
  delete(id: number): Promise<ApiResponse<Record<string, never>>>;
  getTransactions(id: number, params?: ListParams): Promise<ApiResponse<{ customer: Customer; transactions: Transaction[]; pagination: Pagination }>>;
  getRfm(id: number): Promise<ApiResponse<CustomerRfmResponse>>;
}

export interface OrdersApi {
  list(): Promise<ApiResponse<{ orders: Order[] }>>;
  getById(id: number): Promise<ApiResponse<{ order: Order }>>;
  create(body: { customerId: number; orderItems: { productId: number; quantity: number }[]; discountAmount?: number; taxAmount?: number; customerPromotionId?: number }): Promise<ApiResponse<{ order: Order }>>;
}

export interface ProductsApi {
  list(): Promise<ApiResponse<{ products: Product[] }>>;
  getById(id: number): Promise<ApiResponse<{ product: Product }>>;
  create(body: Partial<Product>): Promise<ApiResponse<{ product: Product }>>;
  update(id: number, body: Partial<Product>): Promise<ApiResponse<{ product: Product }>>;
  delete(id: number): Promise<ApiResponse<Record<string, never>>>;
}

export interface PromotionsApi {
  list(): Promise<ApiResponse<{ promotions: Promotion[] }>>;
  getById(id: number): Promise<ApiResponse<{ promotion: Promotion }>>;
  create(body: Partial<Promotion>): Promise<ApiResponse<{ promotion: Promotion }>>;
  update(id: number, body: Partial<Promotion>): Promise<ApiResponse<{ promotion: Promotion }>>;
  delete(id: number): Promise<ApiResponse<Record<string, never>>>;
  assign(id: number, customerId: number): Promise<ApiResponse<{ customerPromotion: CustomerPromotion }>>;
}

export interface CampaignsApi {
  list(): Promise<ApiResponse<{ campaigns: Campaign[] }>>;
  getById(id: number): Promise<ApiResponse<{ campaign: Campaign }>>;
  create(body: Partial<Campaign>): Promise<ApiResponse<{ campaign: Campaign }>>;
  update(id: number, body: Partial<Campaign>): Promise<ApiResponse<{ campaign: Campaign }>>;
  execute(id: number): Promise<ApiResponse<{ messageCount: number }>>;
}

export interface CustomerLevelsApi {
  list(): Promise<ApiResponse<{ customerLevels: CustomerLevel[] }>>;
  getById(id: number): Promise<ApiResponse<{ customerLevel: CustomerLevel }>>;
  update(id: number, body: Partial<CustomerLevel>): Promise<ApiResponse<{ customerLevel: CustomerLevel }>>;
}

export interface TransactionsApi {
  list(params?: ListParams): Promise<ApiResponse<{ transactions: Transaction[]; pagination: Pagination }>>;
  getById(id: number): Promise<ApiResponse<{ transaction: Transaction }>>;
}

export interface ApiClient {
  auth: AuthApi;
  customers: CustomersApi;
  orders: OrdersApi;
  products: ProductsApi;
  promotions: PromotionsApi;
  campaigns: CampaignsApi;
  customerLevels: CustomerLevelsApi;
  transactions: TransactionsApi;
}
