/**
 * Placeholder for real API client.
 *
 * To switch from mock to real backend:
 * 1. Rename this file to real.ts (or create real.ts).
 * 2. Implement ApiClient from ./client using fetch or axios.
 *    Example:
 *    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
 *    const getToken = () => useAuthStore.getState().token;
 *    For each method: fetch(`${baseUrl}/customers`, { headers: { Authorization: `Bearer ${getToken()}` } })
 * 3. In index.ts: export const api = realApiClient;
 */

import type { ApiClient } from './client';

export const realApiClient: ApiClient = {
  auth: {} as ApiClient['auth'],
  customers: {} as ApiClient['customers'],
  orders: {} as ApiClient['orders'],
  products: {} as ApiClient['products'],
  promotions: {} as ApiClient['promotions'],
  campaigns: {} as ApiClient['campaigns'],
  customerLevels: {} as ApiClient['customerLevels'],
  transactions: {} as ApiClient['transactions'],
  users: {} as ApiClient['users'],
  roles: {} as ApiClient['roles'],
  tasks: {} as ApiClient['tasks'],
  projects: {} as ApiClient['projects'],
  workLogs: {} as ApiClient['workLogs'],
};
