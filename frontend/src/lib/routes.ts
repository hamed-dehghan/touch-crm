// frontend/src/lib/routes.ts
/** Canonical app paths: plural resources, `/new` and `/[id]/edit` for forms. */

export const routes = {
  home: '/',
  login: '/login',

  customers: '/customers',
  customer: (id: number | string) => `/customers/${id}`,
  customerNew: '/customers/new',
  customerEdit: (id: number | string) => `/customers/${id}/edit`,

  orders: '/orders',
  order: (id: number | string) => `/orders/${id}`,
  orderNew: '/orders/new',

  products: '/products',
  productNew: '/products/new',
  productEdit: (id: number | string) => `/products/${id}/edit`,

  transactions: '/transactions',
  transactionNew: '/transactions/new',

  promotions: '/promotions',
  promotionNew: '/promotions/new',
  promotionEdit: (id: number | string) => `/promotions/${id}/edit`,

  campaigns: '/campaigns',
  campaign: (id: number | string) => `/campaigns/${id}`,
  campaignNew: '/campaigns/new',

  projects: '/projects',
  projectNew: '/projects/new',
  projectEdit: (id: number | string) => `/projects/${id}/edit`,

  tasks: '/tasks',
  taskNew: '/tasks/new',
  taskEdit: (id: number | string) => `/tasks/${id}/edit`,

  worklogs: '/worklogs',
  worklogNew: '/worklogs/new',
  worklogNewWithTask: (taskId: number | string) => `/worklogs/new?taskId=${taskId}`,

  settingsLevels: '/settings/levels',
  settingsUsers: '/settings/users',
  settingsUserNew: '/settings/users/new',
  settingsUserEdit: (id: number | string) => `/settings/users/${id}/edit`,
  settingsRoles: '/settings/roles',
  settingsRoleNew: '/settings/roles/new',
  settingsRoleEdit: (id: number | string) => `/settings/roles/${id}/edit`,
} as const;
