/**
 * API client entry point.
 *
 * Uses real backend for auth/users/roles and falls back to mock
 * implementation for other resources until they are wired up.
 */

import type { ApiClient } from './client';
import { realApiClient } from './real';

export const api: ApiClient = realApiClient;
export type { ApiClient, ListParams } from './client';
