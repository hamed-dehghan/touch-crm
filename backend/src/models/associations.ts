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

import User from './User.js';
import Role from './Role.js';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';
import Customer from './Customer.js';
import CustomerLevel from './CustomerLevel.js';
import CustomerPhone from './CustomerPhone.js';
import CustomerAddress from './CustomerAddress.js';
import CustomerSocialMedia from './CustomerSocialMedia.js';
import CustomerAttachment from './CustomerAttachment.js';
import CustomerRelatedPersonnel from './CustomerRelatedPersonnel.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Product from './Product.js';
import Transaction from './Transaction.js';
import Promotion from './Promotion.js';
import CustomerPromotion from './CustomerPromotion.js';
import Campaign from './Campaign.js';
import Project from './Project.js';
import Task from './Task.js';
import WorkLog from './WorkLog.js';
import MessageQueue from './MessageQueue.js';

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

  // Customer <-> CustomerPhone (One-to-Many)
  Customer.hasMany(CustomerPhone, {
    foreignKey: 'customerId',
    as: 'phones',
  });
  CustomerPhone.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });

  // Customer <-> CustomerAddress (One-to-Many)
  Customer.hasMany(CustomerAddress, {
    foreignKey: 'customerId',
    as: 'addresses',
  });
  CustomerAddress.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });

  // Customer <-> CustomerSocialMedia (One-to-Many)
  Customer.hasMany(CustomerSocialMedia, {
    foreignKey: 'customerId',
    as: 'socialMedia',
  });
  CustomerSocialMedia.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });

  // Customer <-> CustomerAttachment (One-to-Many)
  Customer.hasMany(CustomerAttachment, {
    foreignKey: 'customerId',
    as: 'attachments',
  });
  CustomerAttachment.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  });

  // Customer <-> CustomerRelatedPersonnel (One-to-Many, for LEGAL entities)
  Customer.hasMany(CustomerRelatedPersonnel, {
    foreignKey: 'legalCustomerId',
    as: 'relatedPersonnel',
  });
  CustomerRelatedPersonnel.belongsTo(Customer, {
    foreignKey: 'legalCustomerId',
    as: 'legalCustomer',
  });
  CustomerRelatedPersonnel.belongsTo(Customer, {
    foreignKey: 'naturalCustomerId',
    as: 'naturalCustomer',
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
    foreignKey: 'userId',
    as: 'loggedBy',
  });
  User.hasMany(WorkLog, {
    foreignKey: 'userId',
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

