# Touch CRM Backend Implementation Documentation

## Overview

This document provides comprehensive documentation for the Touch CRM and Customer Loyalty Platform backend implementation.

## Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Sequelize
- **Database**: PostgreSQL 15+
- **Package Manager**: Bun
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Sequelize models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── validations/     # Yup validation schemas
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── jobs/            # Cron jobs
│   ├── workers/         # Background workers
│   ├── app.ts           # Express app setup
│   └── index.ts         # Application entry point
└── docs/                # Documentation
```

## Database Schema

### Core Tables

- **Users**: System users with role-based access
- **Roles**: User roles (Sales Rep, Manager, Admin)
- **Permissions**: Granular permissions (e.g., customers:create)
- **RolePermissions**: Many-to-many relationship between roles and permissions
- **Customers**: Customer records with status and level
- **CustomerLevels**: Customer loyalty levels (Bronze, Silver, Gold, Platinum)

### Commerce Tables

- **Products**: Product catalog
- **Orders**: Customer orders
- **OrderItems**: Order line items
- **Transactions**: Payment transactions

### Project Management Tables

- **Projects**: Customer projects
- **Tasks**: Task management
- **WorkLogs**: Activity logs

### Marketing Tables

- **Promotions**: Promotion rules
- **CustomerPromotions**: Assigned promotions to customers
- **Campaigns**: SMS campaigns
- **MessageQueue**: SMS message queue

## RBAC System

### Roles

1. **Sales Representative**: Limited access to own customers and tasks
2. **Sales Manager**: Team oversight, campaign management
3. **Administrator**: Full system access

### Permissions

Permissions follow the pattern: `resource:action` (e.g., `customers:create`, `orders:delete`)

Special permissions:
- `_own` suffix: Access only to own resources (e.g., `customers:read_own`)
- `_all` suffix: Access to all resources (e.g., `customers:read_all`)

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - Register new user (Admin only)
- `GET /api/v1/auth/me` - Get current user

### Customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers` - List customers (with filters)
- `GET /api/v1/customers/:id` - Get customer details
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer
- `GET /api/v1/customers/:id/worklogs` - Get customer work logs

### Orders
- `POST /api/v1/orders` - Create order (with auto-promotion)
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order details

### Promotions
- `POST /api/v1/promotions` - Create promotion
- `GET /api/v1/promotions` - List promotions
- `GET /api/v1/promotions/:id` - Get promotion details
- `PUT /api/v1/promotions/:id` - Update promotion
- `DELETE /api/v1/promotions/:id` - Delete promotion
- `POST /api/v1/promotions/:id/assign` - Assign promotion to customer

### Campaigns
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns` - List campaigns
- `GET /api/v1/campaigns/:id` - Get campaign details
- `PUT /api/v1/campaigns/:id` - Update campaign
- `POST /api/v1/campaigns/:id/execute` - Execute campaign

### Tasks & Projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects` - List projects
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/my-tasks` - Get user's tasks
- `PUT /api/v1/tasks/:id/status` - Update task status

### Work Logs
- `POST /api/v1/worklogs` - Create work log
- `GET /api/v1/worklogs` - List work logs

## Background Jobs

### RFM Scoring
- **Schedule**: Daily at 2:00 AM
- **Function**: Calculates Recency, Frequency, Monetary scores for all customers
- **Updates**: Customer levels based on RFM scores

### Birthday Messages
- **Schedule**: Daily at 9:00 AM
- **Function**: Sends birthday messages to customers

### Inactivity Messages
- **Schedule**: Weekly on Mondays at 10:00 AM
- **Function**: Sends re-engagement messages to inactive customers

### Recurring Tasks
- **Schedule**: Daily at 6:00 AM
- **Function**: Duplicates recurring tasks when interval has passed

### Message Queue Worker
- **Schedule**: Continuous (polls every 10 seconds)
- **Function**: Processes pending SMS messages from queue

## Event-Driven Features

### Promotion Assignment

Promotions are automatically assigned when:

1. **First Purchase**: Customer makes their first order
2. **Minimum Purchase**: Order total exceeds promotion threshold
3. **Customer Level**: Customer's level matches promotion condition
4. **Referral**: Customer is referred by another customer

### Welcome Messages

Welcome messages are automatically sent when:
- New customer is created with status=CUSTOMER

## Deployment

### Docker Compose

The application includes a complete Docker Compose setup:

```bash
docker-compose up -d
```

Services:
- PostgreSQL database
- Redis cache
- Backend API
- Nginx reverse proxy

### Environment Variables

See `.env.example` for all required environment variables.

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.

## Default Credentials

- **Username**: admin
- **Password**: Admin123!

**⚠️ IMPORTANT**: Change the default admin password in production!
