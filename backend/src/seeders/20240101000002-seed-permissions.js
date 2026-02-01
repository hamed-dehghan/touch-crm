// backend/src/seeders/20240101000002-seed-permissions.js
export default {
  async up(queryInterface) {
    const permissions = [
      // Customer permissions
      { action_code: 'customers:create', description: 'Create new customers', resource: 'customers' },
      { action_code: 'customers:read_own', description: 'View own customers', resource: 'customers' },
      { action_code: 'customers:read_all', description: 'View all customers', resource: 'customers' },
      { action_code: 'customers:update_own', description: 'Update own customers', resource: 'customers' },
      { action_code: 'customers:update_all', description: 'Update any customer', resource: 'customers' },
      { action_code: 'customers:delete', description: 'Delete customers', resource: 'customers' },

      // Order permissions
      { action_code: 'orders:create', description: 'Create orders', resource: 'orders' },
      { action_code: 'orders:read', description: 'View orders', resource: 'orders' },
      { action_code: 'orders:update', description: 'Update orders', resource: 'orders' },
      { action_code: 'orders:delete', description: 'Delete orders', resource: 'orders' },

      // Task permissions
      { action_code: 'tasks:create', description: 'Create tasks', resource: 'tasks' },
      { action_code: 'tasks:read_own', description: 'View own tasks', resource: 'tasks' },
      { action_code: 'tasks:read_all', description: 'View all tasks', resource: 'tasks' },
      { action_code: 'tasks:assign', description: 'Assign tasks to users', resource: 'tasks' },
      { action_code: 'tasks:update_own', description: 'Update own tasks', resource: 'tasks' },
      { action_code: 'tasks:update_all', description: 'Update any task', resource: 'tasks' },
      { action_code: 'tasks:update_status_own', description: 'Update status of own tasks', resource: 'tasks' },
      { action_code: 'tasks:delete', description: 'Delete tasks', resource: 'tasks' },

      // Work log permissions
      { action_code: 'worklogs:create', description: 'Create work logs', resource: 'worklogs' },
      { action_code: 'worklogs:read_own', description: 'View own work logs', resource: 'worklogs' },
      { action_code: 'worklogs:read_all', description: 'View all work logs', resource: 'worklogs' },
      { action_code: 'worklogs:update', description: 'Update work logs', resource: 'worklogs' },
      { action_code: 'worklogs:delete', description: 'Delete work logs', resource: 'worklogs' },

      // Project permissions
      { action_code: 'projects:create', description: 'Create projects', resource: 'projects' },
      { action_code: 'projects:read_own', description: 'View own projects', resource: 'projects' },
      { action_code: 'projects:read_all', description: 'View all projects', resource: 'projects' },
      { action_code: 'projects:update', description: 'Update projects', resource: 'projects' },
      { action_code: 'projects:delete', description: 'Delete projects', resource: 'projects' },

      // Campaign permissions
      { action_code: 'campaigns:create', description: 'Create campaigns', resource: 'campaigns' },
      { action_code: 'campaigns:read', description: 'View campaigns', resource: 'campaigns' },
      { action_code: 'campaigns:update', description: 'Update campaigns', resource: 'campaigns' },
      { action_code: 'campaigns:execute', description: 'Execute campaigns', resource: 'campaigns' },
      { action_code: 'campaigns:delete', description: 'Delete campaigns', resource: 'campaigns' },

      // Promotion permissions
      { action_code: 'promotions:create', description: 'Create promotions', resource: 'promotions' },
      { action_code: 'promotions:read', description: 'View promotions', resource: 'promotions' },
      { action_code: 'promotions:update', description: 'Update promotions', resource: 'promotions' },
      { action_code: 'promotions:delete', description: 'Delete promotions', resource: 'promotions' },

      // User management permissions
      { action_code: 'users:create', description: 'Create users', resource: 'users' },
      { action_code: 'users:read', description: 'View users', resource: 'users' },
      { action_code: 'users:update', description: 'Update users', resource: 'users' },
      { action_code: 'users:delete', description: 'Delete users', resource: 'users' },

      // Role management permissions
      { action_code: 'roles:manage', description: 'Manage roles and permissions', resource: 'roles' },
      { action_code: 'permissions:manage', description: 'Manage permissions', resource: 'permissions' },

      // System permissions
      { action_code: 'settings:manage', description: 'Manage system settings', resource: 'settings' },
      { action_code: 'reports:read_all', description: 'View all reports and analytics', resource: 'reports' },
      { action_code: 'database:backup', description: 'Database backup operations', resource: 'database' },
      { action_code: 'logs:view', description: 'View system logs', resource: 'logs' },
    ];

    await queryInterface.bulkInsert(
      'permissions',
      permissions.map((p) => ({
        ...p,
        created_at: new Date(),
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
