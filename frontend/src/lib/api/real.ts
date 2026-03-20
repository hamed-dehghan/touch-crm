'use client';

import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiClient } from './client';
import { mockApiClient } from './mock';
import type {
  ApiResponse,
  Role,
  Permission,
  CustomerLevel,
  WorkLog,
  Customer,
  Transaction,
  Pagination,
  CustomerRfmResponse,
  Task,
  Project,
  Order,
  Product,
  Promotion,
  CustomerPromotion,
  Campaign,
} from '@/types/api';
import { useAuthStore } from '@/store/authStore';

const resolveBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In browser dev mode, align API host with current frontend host.
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000/api/v1`;
  }

  return 'http://localhost:3000/api/v1';
};

const baseURL = resolveBaseURL();

const http = axios.create({
  baseURL,
});

const handleUnauthorized = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  useAuthStore.getState().logout();

  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (config.headers) {
    config.headers['Content-Type'] = 'application/json';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

async function request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await http.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<ApiResponse<T> | { message?: string }>;
    const statusCode = err.response?.status ?? 500;
    const isLoginRequest = config.url === '/auth/login';

    if (statusCode === 401 && !isLoginRequest) {
      handleUnauthorized();
    }

    if (err.response?.data && typeof err.response.data === 'object' && 'success' in err.response.data) {
      return err.response.data as ApiResponse<T>;
    }

    const message =
      (err.response?.data as { message?: string } | undefined)?.message ??
      err.message ??
      'Request failed';

    return {
      success: false,
      error: {
        statusCode,
        message,
      },
    };
  }
}

const authApi: ApiClient['auth'] = {
  login(username, password) {
    return request<{ token: string; user: any }>({
      method: 'POST',
      url: '/auth/login',
      data: { username, password },
    });
  },
  getMe() {
    return request<{ user: any }>({
      method: 'GET',
      url: '/auth/me',
    });
  },
};

const customersApi: ApiClient['customers'] = {
  list(params) {
    return request<{ customers: Customer[]; pagination: Pagination }>({
      method: 'GET',
      url: '/customers',
      params,
    });
  },
  getById(id) {
    return request<{ customer: Customer }>({
      method: 'GET',
      url: `/customers/${id}`,
    });
  },
  create(body) {
    return request<{ customer: Customer }>({
      method: 'POST',
      url: '/customers',
      data: body,
    });
  },
  update(id, body) {
    return request<{ customer: Customer }>({
      method: 'PUT',
      url: `/customers/${id}`,
      data: body,
    });
  },
  delete(id) {
    return request<Record<string, never>>({
      method: 'DELETE',
      url: `/customers/${id}`,
    });
  },
  getTransactions(id, params) {
    return request<{ customer: Customer; transactions: Transaction[]; pagination: Pagination }>({
      method: 'GET',
      url: `/customers/${id}/transactions`,
      params,
    });
  },
  async getRfm(id) {
    const rfmResponse = await request<CustomerRfmResponse>({
      method: 'GET',
      url: `/customers/${id}/rfm`,
    });

    // Backend route may not exist yet; keep page functional by falling back to mock.
    if (!rfmResponse.success && rfmResponse.error?.statusCode === 404) {
      return mockApiClient.customers.getRfm(id);
    }

    return rfmResponse;
  },
};

const usersApi: ApiClient['users'] = {
  list() {
    return request<{ users: any[] }>({
      method: 'GET',
      url: '/users',
    });
  },
  create(body) {
    return request<{ user: any }>({
      method: 'POST',
      url: '/users',
      data: body,
    });
  },
  update(id, body) {
    return request<{ user: any }>({
      method: 'PUT',
      url: `/users/${id}`,
      data: body,
    });
  },
  delete(id) {
    return request<Record<string, never>>({
      method: 'DELETE',
      url: `/users/${id}`,
    });
  },
};

const rolesApi: ApiClient['roles'] = {
  list() {
    return request<{ roles: (Role & { permissionCount: number; permissions?: Permission[] })[] }>({
      method: 'GET',
      url: '/roles',
    });
  },
  getById(id) {
    return request<{ role: Role & { permissions?: Permission[] } }>({
      method: 'GET',
      url: `/roles/${id}`,
    });
  },
  create(body) {
    return request<{ role: Role }>({
      method: 'POST',
      url: '/roles',
      data: body,
    });
  },
  update(id, body) {
    return request<{ role: Role }>({
      method: 'PUT',
      url: `/roles/${id}`,
      data: body,
    });
  },
  delete(id) {
    return request<Record<string, never>>({
      method: 'DELETE',
      url: `/roles/${id}`,
    });
  },
  getPermissions() {
    // Backend exposes /api/v1/roles/permissions via role routes
    return request<{ permissions: Permission[] }>({
      method: 'GET',
      url: '/roles/permissions',
    });
  },
  assignPermissions(id, permissionIds) {
    return request<{ role: Role & { permissions?: Permission[] } }>({
      method: 'POST',
      url: `/roles/${id}/permissions`,
      data: { permissionIds },
    });
  },
  removePermission(roleId, permissionId) {
    return request<Record<string, never>>({
      method: 'DELETE',
      url: `/roles/${roleId}/permissions/${permissionId}`,
    });
  },
};

const customerLevelsApi: ApiClient['customerLevels'] = {
  list() {
    return request<{ customerLevels: CustomerLevel[] }>({
      method: 'GET',
      url: '/customer-levels',
    });
  },
  getById(id) {
    return request<{ customerLevel: CustomerLevel }>({
      method: 'GET',
      url: `/customer-levels/${id}`,
    });
  },
  update(id, body) {
    return request<{ customerLevel: CustomerLevel }>({
      method: 'PUT',
      url: `/customer-levels/${id}`,
      data: body,
    });
  },
};

const workLogsApi: ApiClient['workLogs'] = {
  list(params) {
    return request<{ workLogs: WorkLog[] }>({
      method: 'GET',
      url: '/worklogs',
      params,
    });
  },
  create(body) {
    return request<{ workLog: WorkLog }>({
      method: 'POST',
      url: '/worklogs',
      data: body,
    });
  },
  getByCustomer(customerId) {
    return request<{ workLogs: WorkLog[] }>({
      method: 'GET',
      url: `/customers/${customerId}/worklogs`,
    });
  },
};

const tasksApi: ApiClient['tasks'] = {
  list(params) {
    return request<{ tasks: Task[] }>({
      method: 'GET',
      url: '/tasks',
      params,
    });
  },
  getMyTasks() {
    return request<{ tasks: Task[] }>({
      method: 'GET',
      url: '/tasks/my-tasks',
    });
  },
  getById(id) {
    return request<{ task: Task }>({
      method: 'GET',
      url: `/tasks/${id}`,
    });
  },
  create(body) {
    return request<{ task: Task }>({
      method: 'POST',
      url: '/tasks',
      data: body,
    });
  },
  update(id, body) {
    return request<{ task: Task }>({
      method: 'PUT',
      url: `/tasks/${id}`,
      data: body,
    });
  },
  updateStatus(id, status) {
    return request<{ task: Task }>({
      method: 'PUT',
      url: `/tasks/${id}/status`,
      data: { status },
    });
  },
};

const projectsApi: ApiClient['projects'] = {
  list(params) {
    return request<{ projects: Project[] }>({
      method: 'GET',
      url: '/projects',
      params,
    });
  },
  getById(id) {
    return request<{ project: Project }>({
      method: 'GET',
      url: `/projects/${id}`,
    });
  },
  create(body) {
    return request<{ project: Project }>({
      method: 'POST',
      url: '/projects',
      data: body,
    });
  },
  update(id, body) {
    return request<{ project: Project }>({
      method: 'PUT',
      url: `/projects/${id}`,
      data: body,
    });
  },
};

const ordersApi: ApiClient['orders'] = {
  list() {
    return request<{ orders: Order[] }>({
      method: 'GET',
      url: '/orders',
    });
  },
  getById(id) {
    return request<{ order: Order }>({
      method: 'GET',
      url: `/orders/${id}`,
    });
  },
  create(body) {
    return request<{ order: Order }>({
      method: 'POST',
      url: '/orders',
      data: body,
    });
  },
};

const productsApi: ApiClient['products'] = {
  list(params) {
    return request<{ products: Product[]; pagination: Pagination }>({
      method: 'GET',
      url: '/products',
      params,
    });
  },
  getById(id) {
    return request<{ product: Product }>({
      method: 'GET',
      url: `/products/${id}`,
    });
  },
  create(body) {
    return request<{ product: Product }>({
      method: 'POST',
      url: '/products',
      data: body,
    });
  },
  update(id, body) {
    return request<{ product: Product }>({
      method: 'PUT',
      url: `/products/${id}`,
      data: body,
    });
  },
  delete(id) {
    return request<Record<string, never>>({
      method: 'DELETE',
      url: `/products/${id}`,
    });
  },
};

const transactionsApi: ApiClient['transactions'] = {
  list(params) {
    return request<{ transactions: Transaction[]; pagination: Pagination }>({
      method: 'GET',
      url: '/transactions',
      params,
    });
  },
  getById(id) {
    return request<{ transaction: Transaction }>({
      method: 'GET',
      url: `/transactions/${id}`,
    });
  },
  create(body) {
    return request<{ transaction: Transaction }>({
      method: 'POST',
      url: '/transactions',
      data: body,
    });
  },
};

const promotionsApi: ApiClient['promotions'] = {
  list() {
    return request<{ promotions: Promotion[] }>({
      method: 'GET',
      url: '/promotions',
    });
  },
  getById(id) {
    return request<{ promotion: Promotion }>({
      method: 'GET',
      url: `/promotions/${id}`,
    });
  },
  create(body) {
    return request<{ promotion: Promotion }>({
      method: 'POST',
      url: '/promotions',
      data: body,
    });
  },
  update(id, body) {
    return request<{ promotion: Promotion }>({
      method: 'PUT',
      url: `/promotions/${id}`,
      data: body,
    });
  },
  delete(id) {
    return request<Record<string, never>>({
      method: 'DELETE',
      url: `/promotions/${id}`,
    });
  },
  assign(id, customerId) {
    return request<{ customerPromotion: CustomerPromotion }>({
      method: 'POST',
      url: `/promotions/${id}/assign`,
      data: { customerId },
    });
  },
};

const campaignsApi: ApiClient['campaigns'] = {
  list() {
    return request<{ campaigns: Campaign[] }>({
      method: 'GET',
      url: '/campaigns',
    });
  },
  getById(id) {
    return request<{ campaign: Campaign }>({
      method: 'GET',
      url: `/campaigns/${id}`,
    });
  },
  create(body) {
    return request<{ campaign: Campaign }>({
      method: 'POST',
      url: '/campaigns',
      data: body,
    });
  },
  update(id, body) {
    return request<{ campaign: Campaign }>({
      method: 'PUT',
      url: `/campaigns/${id}`,
      data: body,
    });
  },
  execute(id) {
    return request<{ messageCount: number }>({
      method: 'POST',
      url: `/campaigns/${id}/execute`,
    });
  },
};

export const realApiClient: ApiClient = {
  auth: authApi,
  customers: customersApi,
  orders: ordersApi,
  products: productsApi,
  promotions: promotionsApi,
  campaigns: campaignsApi,
  customerLevels: customerLevelsApi,
  transactions: transactionsApi,
  users: usersApi,
  roles: rolesApi,
  tasks: tasksApi,
  projects: projectsApi,
  workLogs: workLogsApi,
};

