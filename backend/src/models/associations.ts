/**
 * Sequelize Model Associations
 * 
 * Defines all relationships between models.
 * Must be imported after all models are initialized.
 * 
 * Relationship Types:
 * - hasMany: One-to-many
 * - belongsTo: Many-to-one  
 * - belongsToMany: Many-to-many (with junction table)
 */

import User from './User';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import Customer from './Customer';
import CustomerLevel from './CustomerLevel';
import Order from './Order';
import OrderItem from './OrderItem';
import Product from './Product';
import Transaction from './Transaction';
import Promotion from './Promotion';
import CustomerPromotion from './CustomerPromotion';
import Campaign from './Campaign';
import Project from './Project';
import Task from './Task';
import WorkLog from './WorkLog';
import MessageQueue from './MessageQueue';

/**
 * Define all model associations
 */
export const initializeAssociations = (): void => {
  // Role <-> Permission (Many-to-Many)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
  });

  // User <-> Role (Many-to-One)
  User.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role',
  });
  Role.hasMany(User, {
    foreignKey: 'roleId',
    as: 'users',
  });

  // Customer <-> CustomerLevel (Many-to-One)
  Customer.belongsTo(CustomerLevel, {
    foreignKey: 'customerLevelId',
    as: 'customerLevel',
  });
  CustomerLevel.hasMany(Customer, {
    foreignKey: 'customerLevelId',
    as: 'customers',
  });

  // Customer <-> Customer (Self-referencing for referrals)
  Customer.belongsTo(Customer, {
    foreignKey: 'referredByCustomerId',
    as: 'referredBy',
  });
  Customer.hasMany(Customer, {
    foreignKey: 'referredByCustomerId',
    as: 'referrals',
  });

  // Order <-> Customer (Many-to-One)
  Order.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });
  Customer.hasMany(Order, {
    foreignKey: 'customerId',
    as: 'orders',
  });

  // Order <-> User (created by)
  Order.belongsTo(User, {
    foreignKey: 'createdByUserId',
    as: 'createdBy',
  });

  // Order <-> OrderItem (One-to-Many)
  Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'orderItems',
  });
  OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
  });

  // OrderItem <-> Product (Many-to-One)
  OrderItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
  });
  Product.hasMany(OrderItem, {
    foreignKey: 'productId',
    as: 'orderItems',
  });

  // Transaction <-> Customer (Many-to-One)
  Transaction.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });
  Customer.hasMany(Transaction, {
    foreignKey: 'customerId',
    as: 'transactions',
  });

  // Transaction <-> Order (Many-to-One, optional)
  Transaction.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
  });
  Order.hasMany(Transaction, {
    foreignKey: 'orderId',
    as: 'transactions',
  });

  // Promotion <-> CustomerPromotion (One-to-Many)
  Promotion.hasMany(CustomerPromotion, {
    foreignKey: 'promotionId',
    as: 'customerPromotions',
  });
  CustomerPromotion.belongsTo(Promotion, {
    foreignKey: 'promotionId',
    as: 'promotion',
  });

  // Customer <-> CustomerPromotion (One-to-Many)
  Customer.hasMany(CustomerPromotion, {
    foreignKey: 'customerId',
    as: 'customerPromotions',
  });
  CustomerPromotion.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });

  // Campaign <-> User (created by)
  Campaign.belongsTo(User, {
    foreignKey: 'createdByUserId',
    as: 'createdBy',
  });
  User.hasMany(Campaign, {
    foreignKey: 'createdByUserId',
    as: 'campaigns',
  });

  // Project <-> Customer (Many-to-One)
  Project.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });
  Customer.hasMany(Project, {
    foreignKey: 'customerId',
    as: 'projects',
  });

  // Task <-> Project (Many-to-One)
  Task.belongsTo(Project, {
    foreignKey: 'projectId',
    as: 'project',
  });
  Project.hasMany(Task, {
    foreignKey: 'projectId',
    as: 'tasks',
  });

  // Task <-> User (assigned to)
  Task.belongsTo(User, {
    foreignKey: 'assignedToUserId',
    as: 'assignedTo',
  });
  User.hasMany(Task, {
    foreignKey: 'assignedToUserId',
    as: 'assignedTasks',
  });

  // Task <-> User (created by)
  Task.belongsTo(User, {
    foreignKey: 'createdByUserId',
    as: 'createdBy',
  });
  User.hasMany(Task, {
    foreignKey: 'createdByUserId',
    as: 'createdTasks',
  });

  // WorkLog <-> Customer (Many-to-One)
  WorkLog.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });
  Customer.hasMany(WorkLog, {
    foreignKey: 'customerId',
    as: 'workLogs',
  });

  // WorkLog <-> Task (Many-to-One, optional)
  WorkLog.belongsTo(Task, {
    foreignKey: 'taskId',
    as: 'task',
  });
  Task.hasMany(WorkLog, {
    foreignKey: 'taskId',
    as: 'workLogs',
  });

  // WorkLog <-> User (logged by)
  WorkLog.belongsTo(User, {
    foreignKey: 'loggedByUserId',
    as: 'loggedBy',
  });
  User.hasMany(WorkLog, {
    foreignKey: 'loggedByUserId',
    as: 'workLogs',
  });

  // MessageQueue <-> Customer (Many-to-One, optional)
  MessageQueue.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });
  Customer.hasMany(MessageQueue, {
    foreignKey: 'customerId',
    as: 'messages',
  });
};

