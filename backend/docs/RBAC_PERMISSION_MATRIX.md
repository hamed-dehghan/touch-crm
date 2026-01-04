# RBAC Permission Matrix

This document provides a comprehensive overview of the Role-Based Access Control (RBAC) system, including all permissions and their assignments to default roles.

## Overview

The system implements a granular permission-based RBAC system with three default roles:
1. **Sales Representative (کارشناس فروش)** - Front-line staff
2. **Sales Manager (مدیر فروش)** - Team supervision and campaign management
3. **Administrator (مدیر کل)** - Full system access

## Permission Naming Convention

Permissions follow the pattern: `resource:action`

### Special Suffixes:
- `_own`: Access only to resources owned by/assigned to the user
- `_all`: Access to all resources regardless of ownership

## Complete Permission List

### Customer Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `customers:create` | Create new customers | ✅ | ✅ | ✅ |
| `customers:read_own` | View own assigned customers | ✅ | ❌ | ❌ |
| `customers:read_all` | View all customers | ❌ | ✅ | ✅ |
| `customers:update_own` | Update own assigned customers | ✅ | ❌ | ❌ |
| `customers:update_all` | Update any customer | ❌ | ✅ | ✅ |
| `customers:delete` | Delete customers | ❌ | ✅ | ✅ |

### Order Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `orders:create` | Create new orders | ✅ | ✅ | ✅ |
| `orders:read` | View orders | ✅ | ✅ | ✅ |
| `orders:update` | Update orders | ❌ | ✅ | ✅ |
| `orders:delete` | Delete orders | ❌ | ✅ | ✅ |

### Task Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `tasks:create` | Create new tasks | ❌ | ✅ | ✅ |
| `tasks:read_own` | View own assigned tasks | ✅ | ❌ | ❌ |
| `tasks:read_all` | View all tasks | ❌ | ✅ | ✅ |
| `tasks:assign` | Assign tasks to users | ❌ | ✅ | ✅ |
| `tasks:update_own` | Update own tasks | ✅ | ❌ | ❌ |
| `tasks:update_all` | Update any task | ❌ | ✅ | ✅ |
| `tasks:update_status_own` | Update status of own tasks | ✅ | ✅ | ✅ |
| `tasks:delete` | Delete tasks | ❌ | ✅ | ✅ |

### Work Log Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `worklogs:create` | Create work logs | ✅ | ✅ | ✅ |
| `worklogs:read_own` | View own work logs | ✅ | ❌ | ❌ |
| `worklogs:read_all` | View all work logs | ❌ | ✅ | ✅ |
| `worklogs:update` | Update work logs | ❌ | ✅ | ✅ |
| `worklogs:delete` | Delete work logs | ❌ | ✅ | ✅ |

### Project Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `projects:create` | Create new projects | ❌ | ✅ | ✅ |
| `projects:read_own` | View projects for assigned customers | ✅ | ❌ | ❌ |
| `projects:read_all` | View all projects | ❌ | ✅ | ✅ |
| `projects:update` | Update projects | ❌ | ✅ | ✅ |
| `projects:delete` | Delete projects | ❌ | ✅ | ✅ |

### Campaign Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `campaigns:create` | Create SMS campaigns | ❌ | ✅ | ✅ |
| `campaigns:read` | View campaigns | ❌ | ✅ | ✅ |
| `campaigns:update` | Update campaigns | ❌ | ✅ | ✅ |
| `campaigns:execute` | Execute campaigns | ❌ | ✅ | ✅ |
| `campaigns:delete` | Delete campaigns | ❌ | ✅ | ✅ |

### Promotion Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `promotions:create` | Create promotions | ❌ | ✅ | ✅ |
| `promotions:read` | View promotions | ❌ | ✅ | ✅ |
| `promotions:update` | Update promotions | ❌ | ✅ | ✅ |
| `promotions:delete` | Delete promotions | ❌ | ✅ | ✅ |

### User Management Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `users:create` | Create new users | ❌ | ❌ | ✅ |
| `users:read` | View all users | ❌ | ❌ | ✅ |
| `users:update` | Update users | ❌ | ❌ | ✅ |
| `users:delete` | Delete users | ❌ | ❌ | ✅ |

### Role Management Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `roles:manage` | Manage roles and permissions | ❌ | ❌ | ✅ |
| `permissions:manage` | Manage permissions | ❌ | ❌ | ✅ |

### System Permissions

| Permission Code | Description | Sales Rep | Sales Manager | Administrator |
|----------------|-------------|:---------:|:-------------:|:-------------:|
| `settings:manage` | Manage system settings | ❌ | ❌ | ✅ |
| `reports:read_all` | View all reports and analytics | ❌ | ✅ | ✅ |
| `database:backup` | Database backup operations | ❌ | ❌ | ✅ |
| `logs:view` | View system logs | ❌ | ❌ | ✅ |

## Role Descriptions

### Sales Representative (کارشناس فروش)

**Purpose**: Front-line staff handling daily customer interactions

**Key Capabilities**:
- Create and manage assigned customers
- Log work activities
- View and update status of assigned tasks
- Create orders for customers
- View projects for assigned customers

**Restrictions**:
- Cannot view other users' customers
- Cannot delete any resources
- No access to campaigns or promotions
- No access to system settings or user management

**Typical Use Cases**:
- Daily customer follow-ups
- Recording customer interactions
- Processing customer orders
- Completing assigned tasks

---

### Sales Manager (مدیر فروش)

**Purpose**: Team supervision, campaign management, and reporting

**Inherited**: All Sales Representative permissions

**Additional Capabilities**:
- View and update all customers (team oversight)
- Create, assign, and manage all tasks
- View all team work logs
- Delete customers and orders
- Create and execute SMS campaigns
- Create and manage promotions
- Access reports and analytics
- Update any task

**Restrictions**:
- Cannot manage users or roles
- Cannot access system settings
- Cannot perform database operations

**Typical Use Cases**:
- Team performance monitoring
- Campaign creation and execution
- Customer segmentation and targeting
- Sales analytics and reporting
- Task assignment and tracking

---

### Administrator (مدیر کل)

**Purpose**: Complete system management

**Inherited**: All Sales Manager permissions

**Additional Capabilities**:
- Create, update, and delete users
- Manage roles and permissions
- Access system settings
- Perform database backup operations
- View system logs
- Full access to all features

**Typical Use Cases**:
- User account management
- Role and permission configuration
- System configuration
- Security management
- Data backup and recovery

## API Endpoint Permission Requirements

### Authentication Endpoints
- `POST /api/v1/auth/login` - No permission required
- `POST /api/v1/auth/register` - `users:create`
- `GET /api/v1/auth/me` - Authenticated user only

### Customer Endpoints
- `POST /api/v1/customers` - `customers:create`
- `GET /api/v1/customers` - `customers:read_own` OR `customers:read_all`
- `GET /api/v1/customers/:id` - `customers:read_own` OR `customers:read_all`
- `PUT /api/v1/customers/:id` - `customers:update_own` OR `customers:update_all`
- `DELETE /api/v1/customers/:id` - `customers:delete`
- `GET /api/v1/customers/:id/worklogs` - `worklogs:read_own` OR `worklogs:read_all`
- `GET /api/v1/customers/:id/transactions` - `orders:read`

### Order Endpoints
- `POST /api/v1/orders` - `orders:create`
- `GET /api/v1/orders` - `orders:read`
- `GET /api/v1/orders/:id` - `orders:read`

### Transaction Endpoints
- `POST /api/v1/transactions` - `orders:create`
- `GET /api/v1/transactions` - `orders:read`
- `GET /api/v1/transactions/:id` - `orders:read`

### Product Endpoints
- `POST /api/v1/products` - `orders:create`
- `GET /api/v1/products` - `orders:read`
- `PUT /api/v1/products/:id` - `orders:update`
- `DELETE /api/v1/products/:id` - `orders:delete`

### Task Endpoints
- `POST /api/v1/tasks` - `tasks:create`
- `GET /api/v1/tasks` - `tasks:read_own` OR `tasks:read_all`
- `GET /api/v1/tasks/my-tasks` - Authenticated user only
- `PUT /api/v1/tasks/:id` - `tasks:update_own` OR `tasks:update_all`
- `PUT /api/v1/tasks/:id/status` - `tasks:update_status_own`
- `DELETE /api/v1/tasks/:id` - `tasks:delete`

### Campaign Endpoints
- `POST /api/v1/campaigns` - `campaigns:create`
- `GET /api/v1/campaigns` - `campaigns:read`
- `PUT /api/v1/campaigns/:id` - `campaigns:update`
- `POST /api/v1/campaigns/:id/execute` - `campaigns:execute`
- `DELETE /api/v1/campaigns/:id` - `campaigns:delete`

### Promotion Endpoints
- `POST /api/v1/promotions` - `promotions:create`
- `GET /api/v1/promotions` - `promotions:read`
- `PUT /api/v1/promotions/:id` - `promotions:update`
- `DELETE /api/v1/promotions/:id` - `promotions:delete`

### User Management Endpoints
- `POST /api/v1/users` - `users:create`
- `GET /api/v1/users` - `users:read`
- `PUT /api/v1/users/:id` - `users:update`
- `DELETE /api/v1/users/:id` - `users:delete`

### Role Management Endpoints
- `GET /api/v1/roles` - `roles:manage`
- `POST /api/v1/roles` - `roles:manage`
- `PUT /api/v1/roles/:id` - `roles:manage`
- `DELETE /api/v1/roles/:id` - `roles:manage`
- `GET /api/v1/permissions` - `permissions:manage`
- `POST /api/v1/roles/:id/permissions` - `roles:manage`
- `DELETE /api/v1/roles/:id/permissions/:permissionId` - `roles:manage`

## Middleware Implementation

The RBAC system is implemented using middleware in `src/middlewares/rbac.middleware.ts`:

### `requirePermission(actionCode: string)`
Checks if the authenticated user has a specific permission.

**Example**:
```typescript
router.delete('/customers/:id', 
  authenticate, 
  requirePermission('customers:delete'), 
  deleteCustomer
);
```

### `requireAnyPermission(actionCodes: string[])`
Checks if the authenticated user has at least one of the specified permissions.

**Example**:
```typescript
router.get('/customers', 
  authenticate, 
  requireAnyPermission(['customers:read_own', 'customers:read_all']), 
  getCustomers
);
```

## Adding New Permissions

To add a new permission:

1. **Create Migration**: Add permission to `permissions` table
2. **Update Seeder**: Add permission to seed data
3. **Assign to Roles**: Update role-permission mappings
4. **Apply Middleware**: Use in route definitions
5. **Update Documentation**: Update this matrix

## Security Best Practices

1. **Principle of Least Privilege**: Users should have only the minimum permissions needed
2. **Regular Audits**: Review and audit permission assignments regularly
3. **Role Separation**: Keep clear boundaries between role capabilities
4. **Permission Granularity**: Use specific permissions rather than broad access
5. **Ownership Checks**: Always verify resource ownership for `_own` permissions

## Default Credentials

**Admin User** (created by seeder):
- Username: `admin`
- Password: `Admin123!`
- Role: Administrator

⚠️ **IMPORTANT**: Change the default admin password immediately after deployment!
