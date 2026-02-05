/**
 * API client entry point.
 * Use mock implementation by default; swap to real client when backend is ready:
 * import { realApiClient } from './real';
 * export const api = realApiClient;
 */

import type { ApiClient } from './client';
import { mockApiClient } from './mock';

export const api: ApiClient = mockApiClient;
export type { ApiClient, ListParams } from './client';
