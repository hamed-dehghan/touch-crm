/**
 * API client entry point.
 */

import type { ApiClient } from './client';
import { realApiClient } from './real';

export const api: ApiClient = realApiClient;
export type { ApiClient, ListParams } from './client';
