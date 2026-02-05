/**
 * Mock API implementation — uses in-memory data from mockDb.
 * Matches backend API contract; swap with real client when backend is ready.
 */

import type { ApiClient } from './client';
import type { CustomerRfmResponse, RfmScores } from '@/types/api';
import {
  users,
  roles,
  permissions,
  rolePermissions,
  customerLevels,
  customers,
  products,
  orders,
  orderItems,
  transactions,
  promotions,
  customerPromotions,
  campaigns,
  projects,
  tasks,
  workLogs,
  getNextId,
} from '@/data/mockDb';

function paginate<T>(arr: T[], page = 1, limit = 20): { rows: T[]; pagination: Pagination } {
  const total = arr.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;
  const rows = arr.slice(offset, offset + limit);
  return {
    rows,
    pagination: { page, limit, total, totalPages },
  };
}

function matchSearch(text: string, search?: string): boolean {
  if (!search?.trim()) return true;
  return text.toLowerCase().includes(search.toLowerCase().trim());
}

const authApi: ApiClient['auth'] = {
  async login(username, password) {
    const user = users.find((u) => u.username === username);
    if (!user || password !== 'Admin123!') {
      return { success: false, error: { message: 'Invalid credentials', statusCode: 401 } };
    }
    return {
      success: true,
      data: { token: 'mock-jwt-' + user.id, user },
    };
  },
  async getMe() {
    const user = users[0];
    return { success: true, data: { user: user! } };
  },
};

const customersApi: ApiClient['customers'] = {
  async list(params) {
    const { page = 1, limit = 20, search, status } = params || {};
    let list = [...customers];
    if (search) {
      list = list.filter(
        (c) =>
          matchSearch(c.firstName ?? '', search) ||
          matchSearch(c.lastName ?? '', search) ||
          matchSearch(c.phoneNumber, search) ||
          matchSearch(c.email ?? '', search)
      );
    }
    if (status) list = list.filter((c) => c.status === status);
    const { rows, pagination: p } = paginate(list, page, limit);
    return { success: true, data: { customers: rows, pagination: p } };
  },
  async getById(id) {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    return { success: true, data: { customer } };
  },
  async create(body) {
    if (customers.some((c) => c.phoneNumber === body.phoneNumber)) {
      return { success: false, error: { message: 'Phone number already exists', statusCode: 400 } };
    }
    const id = getNextId('customer');
    const level = body.customerLevelId ? customerLevels.find((l) => l.id === body.customerLevelId) : undefined;
    const customer: typeof customers[0] = {
      id,
      firstName: body.firstName,
      lastName: body.lastName!,
      phoneNumber: body.phoneNumber!,
      email: body.email,
      birthDate: body.birthDate,
      status: body.status ?? 'LEAD',
      customerType: body.customerType ?? 'PERSON',
      companyName: body.companyName,
      address: body.address,
      website: body.website,
      customerLevelId: body.customerLevelId,
      referredByCustomerId: body.referredByCustomerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerLevel: level,
    };
    customers.push(customer);
    return { success: true, data: { customer } };
  },
  async update(id, body) {
    const idx = customers.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    const level = body.customerLevelId !== undefined ? customerLevels.find((l) => l.id === body.customerLevelId) : customers[idx].customerLevel;
    customers[idx] = { ...customers[idx], ...body, customerLevel: level, updatedAt: new Date().toISOString() };
    return { success: true, data: { customer: customers[idx] } };
  },
  async delete(id) {
    const idx = customers.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    customers.splice(idx, 1);
    return { success: true };
  },
  async getTransactions(id, params) {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    const list = transactions.filter((t) => t.customerId === id);
    const { page = 1, limit = 20 } = params || {};
    const { rows, pagination: p } = paginate(list, page, limit);
    return { success: true, data: { customer, transactions: rows, pagination: p } };
  },
  async getRfm(id) {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    const custOrders = orders.filter((o) => o.customerId === id).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    const frequency = custOrders.length;
    const monetary = custOrders.reduce((s, o) => s + o.finalAmount, 0);
    const recencyDays = custOrders.length ? Math.floor((Date.now() - new Date(custOrders[0].orderDate).getTime()) / 86400000) : 999;
    const recency = recencyDays <= 7 ? 5 : recencyDays <= 30 ? 4 : recencyDays <= 90 ? 3 : recencyDays <= 180 ? 2 : 1;
    const frequencyScore = frequency >= 20 ? 5 : frequency >= 11 ? 4 : frequency >= 6 ? 3 : frequency >= 3 ? 2 : 1;
    const monetaryScore = monetary >= 10000 ? 5 : monetary >= 5001 ? 4 : monetary >= 1001 ? 3 : monetary >= 501 ? 2 : 1;
    const averageScore = (recency + frequencyScore + monetaryScore) / 3;
    const rfm: RfmScores = { recency, frequency: frequencyScore, monetary: monetaryScore, averageScore: Math.round(averageScore * 100) / 100 };
    const level = customerLevels.find((l) => averageScore >= l.minScore && averageScore <= l.maxScore) ?? null;
    const data: CustomerRfmResponse = { customerId: id, rfm, customerLevel: level };
    return { success: true, data };
  },
};

const ordersApi: ApiClient['orders'] = {
  async list() {
    return { success: true, data: { orders: [...orders] } };
  },
  async getById(id) {
    const order = orders.find((o) => o.id === id);
    if (!order) return { success: false, error: { message: 'Order not found', statusCode: 404 } };
    return { success: true, data: { order } };
  },
  async create(body) {
    const customer = customers.find((c) => c.id === body.customerId);
    if (!customer) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    let totalAmount = 0;
    const items: typeof orderItems = [];
    for (const row of body.orderItems) {
      const product = products.find((p) => p.id === row.productId);
      if (!product) return { success: false, error: { message: `Product ${row.productId} not found`, statusCode: 404 } };
      const qty = row.quantity || 1;
      totalAmount += product.price * qty;
      const oiId = getNextId('orderItem');
      items.push({ id: oiId, orderId: 0, productId: product.id, quantity: qty, pricePerUnit: product.price, product });
    }
    const discount = body.discountAmount ?? 0;
    const tax = body.taxAmount ?? 0;
    const finalAmount = totalAmount - discount + tax;
    const orderId = getNextId('order');
    const order: typeof orders[0] = {
      id: orderId,
      customerId: body.customerId,
      orderDate: new Date().toISOString(),
      totalAmount,
      discountAmount: discount,
      taxAmount: tax,
      finalAmount,
      createdByUserId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer,
      orderItems: items.map((i) => ({ ...i, orderId })),
    };
    orders.push(order);
    for (const i of items) orderItems.push({ ...i, orderId });
    if (body.customerPromotionId) {
      const cp = customerPromotions.find((c) => c.id === body.customerPromotionId);
      if (cp) cp.isUsed = true;
    }
    return { success: true, data: { order } };
  },
};

const productsApi: ApiClient['products'] = {
  async list() {
    return { success: true, data: { products: [...products] } };
  },
  async getById(id) {
    const product = products.find((p) => p.id === id);
    if (!product) return { success: false, error: { message: 'Product not found', statusCode: 404 } };
    return { success: true, data: { product } };
  },
  async create(body) {
    const id = getNextId('product');
    const product = { id, productName: body.productName!, price: body.price!, taxRate: body.taxRate ?? 0, createdAt: '', updatedAt: '' };
    products.push(product);
    return { success: true, data: { product } };
  },
  async update(id, body) {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: { message: 'Product not found', statusCode: 404 } };
    products[idx] = { ...products[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { product: products[idx] } };
  },
  async delete(id) {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: { message: 'Product not found', statusCode: 404 } };
    products.splice(idx, 1);
    return { success: true };
  },
};

const promotionsApi: ApiClient['promotions'] = {
  async list() {
    return { success: true, data: { promotions: [...promotions] } };
  },
  async getById(id) {
    const promotion = promotions.find((p) => p.id === id);
    if (!promotion) return { success: false, error: { message: 'Promotion not found', statusCode: 404 } };
    return { success: true, data: { promotion } };
  },
  async create(body) {
    const id = getNextId('promotion');
    const promotion = {
      id,
      title: body.title!,
      rewardType: body.rewardType!,
      rewardValue: body.rewardValue!,
      conditionJson: body.conditionJson!,
      durationDays: body.durationDays,
      isActive: body.isActive ?? true,
      createdAt: '',
      updatedAt: '',
    };
    promotions.push(promotion);
    return { success: true, data: { promotion } };
  },
  async update(id, body) {
    const idx = promotions.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: { message: 'Promotion not found', statusCode: 404 } };
    promotions[idx] = { ...promotions[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { promotion: promotions[idx] } };
  },
  async delete(id) {
    const idx = promotions.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: { message: 'Promotion not found', statusCode: 404 } };
    promotions.splice(idx, 1);
    return { success: true };
  },
  async assign(id, customerId) {
    const promotion = promotions.find((p) => p.id === id);
    if (!promotion) return { success: false, error: { message: 'Promotion not found', statusCode: 404 } };
    const cpId = getNextId('customerPromotion');
    const cp = {
      id: cpId,
      customerId,
      promotionId: id,
      assignedAt: new Date().toISOString(),
      expiryDate: promotion.durationDays ? new Date(Date.now() + promotion.durationDays * 86400000).toISOString().slice(0, 10) : undefined,
      isUsed: false,
      createdAt: '',
      updatedAt: '',
      promotion,
    };
    customerPromotions.push(cp);
    return { success: true, data: { customerPromotion: cp } };
  },
};

const campaignsApi: ApiClient['campaigns'] = {
  async list() {
    return { success: true, data: { campaigns: [...campaigns] } };
  },
  async getById(id) {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return { success: false, error: { message: 'Campaign not found', statusCode: 404 } };
    return { success: true, data: { campaign } };
  },
  async create(body) {
    const id = getNextId('campaign');
    const campaign = {
      id,
      name: body.name!,
      messageTemplate: body.messageTemplate!,
      filterConditionsJson: body.filterConditionsJson ?? '{}',
      scheduledSendTime: body.scheduledSendTime,
      status: (body.status as typeof campaigns[0]['status']) ?? 'DRAFT',
      createdByUserId: 1,
      createdAt: '',
      updatedAt: '',
      createdBy: users[0],
    };
    campaigns.push(campaign);
    return { success: true, data: { campaign } };
  },
  async update(id, body) {
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false, error: { message: 'Campaign not found', statusCode: 404 } };
    campaigns[idx] = { ...campaigns[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { campaign: campaigns[idx] } };
  },
  async execute(id) {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return { success: false, error: { message: 'Campaign not found', statusCode: 404 } };
    const messageCount = customers.filter((c) => c.status === 'CUSTOMER').length;
    campaigns[campaigns.indexOf(campaign)].status = 'SENT';
    return { success: true, data: { messageCount }, message: `Campaign executed successfully. ${messageCount} messages queued.` };
  },
};

const customerLevelsApi: ApiClient['customerLevels'] = {
  async list() {
    return { success: true, data: { customerLevels: [...customerLevels] } };
  },
  async getById(id) {
    const level = customerLevels.find((l) => l.id === id);
    if (!level) return { success: false, error: { message: 'Customer level not found', statusCode: 404 } };
    return { success: true, data: { customerLevel: level } };
  },
  async update(id, body) {
    const idx = customerLevels.findIndex((l) => l.id === id);
    if (idx === -1) return { success: false, error: { message: 'Customer level not found', statusCode: 404 } };
    customerLevels[idx] = { ...customerLevels[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { customerLevel: customerLevels[idx] } };
  },
};

const transactionsApi: ApiClient['transactions'] = {
  async list(params) {
    const { page = 1, limit = 20, customerId, orderId } = params || {};
    let list = [...transactions];
    if (customerId) list = list.filter((t) => t.customerId === customerId);
    if (orderId) list = list.filter((t) => t.orderId === orderId);
    const { rows, pagination } = paginate(list, page, limit);
    return { success: true, data: { transactions: rows, pagination } };
  },
  async getById(id) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return { success: false, error: { message: 'Transaction not found', statusCode: 404 } };
    return { success: true, data: { transaction } };
  },
  async create(body) {
    const customer = customers.find((c) => c.id === body.customerId);
    if (!customer) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    if (body.orderId) {
      const order = orders.find((o) => o.id === body.orderId);
      if (!order) return { success: false, error: { message: 'Order not found', statusCode: 404 } };
    }
    const id = getNextId('transaction');
    const transaction: typeof transactions[0] = {
      id,
      customerId: body.customerId,
      orderId: body.orderId,
      paymentMethod: body.paymentMethod as 'CASH' | 'CHECK',
      amount: body.amount,
      transactionDate: body.transactionDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer,
    };
    transactions.push(transaction);
    return { success: true, data: { transaction } };
  },
};

const usersApi: ApiClient['users'] = {
  async list() {
    return { success: true, data: { users: users.map((u) => ({ ...u })) } };
  },
  async create(body) {
    if (users.some((u) => u.username === body.username)) {
      return { success: false, error: { message: 'Username already exists', statusCode: 400 } };
    }
    const id = getNextId('user');
    const role = roles.find((r) => r.id === body.roleId);
    const user: typeof users[0] = {
      id,
      username: body.username,
      fullName: body.fullName,
      email: body.email,
      roleId: body.roleId,
      isActive: true,
      createdAt: new Date().toISOString(),
      role,
    };
    users.push(user);
    return { success: true, data: { user } };
  },
  async update(id, body) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, error: { message: 'User not found', statusCode: 404 } };
    const role = body.roleId ? roles.find((r) => r.id === body.roleId) : users[idx].role;
    users[idx] = { ...users[idx], ...body, role };
    return { success: true, data: { user: users[idx] } };
  },
  async delete(id) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { success: false, error: { message: 'User not found', statusCode: 404 } };
    users.splice(idx, 1);
    return { success: true };
  },
};

const rolesApi: ApiClient['roles'] = {
  async list() {
    const result = roles.map((r) => {
      const perms = rolePermissions.filter((rp) => rp.roleId === r.id).map((rp) => permissions.find((p) => p.id === rp.permissionId)!).filter(Boolean);
      return { ...r, permissionCount: perms.length, permissions: perms };
    });
    return { success: true, data: { roles: result } };
  },
  async getById(id) {
    const role = roles.find((r) => r.id === id);
    if (!role) return { success: false, error: { message: 'Role not found', statusCode: 404 } };
    const perms = rolePermissions.filter((rp) => rp.roleId === id).map((rp) => permissions.find((p) => p.id === rp.permissionId)!).filter(Boolean);
    return { success: true, data: { role: { ...role, permissions: perms } } };
  },
  async create(body) {
    const id = getNextId('role');
    const role = { id, roleName: body.roleName, description: body.description, createdAt: '', updatedAt: '' };
    roles.push(role);
    return { success: true, data: { role } };
  },
  async update(id, body) {
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: { message: 'Role not found', statusCode: 404 } };
    roles[idx] = { ...roles[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { role: roles[idx] } };
  },
  async delete(id) {
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: { message: 'Role not found', statusCode: 404 } };
    if (users.some((u) => u.roleId === id)) return { success: false, error: { message: 'Cannot delete role with assigned users', statusCode: 400 } };
    roles.splice(idx, 1);
    return { success: true };
  },
  async getPermissions() {
    return { success: true, data: { permissions: [...permissions] } };
  },
  async assignPermissions(id, permissionIds) {
    const role = roles.find((r) => r.id === id);
    if (!role) return { success: false, error: { message: 'Role not found', statusCode: 404 } };
    // Remove old
    const toRemove = rolePermissions.filter((rp) => rp.roleId === id);
    toRemove.forEach((rp) => { const i = rolePermissions.indexOf(rp); if (i !== -1) rolePermissions.splice(i, 1); });
    // Add new
    permissionIds.forEach((pid) => rolePermissions.push({ roleId: id, permissionId: pid }));
    const perms = permissionIds.map((pid) => permissions.find((p) => p.id === pid)!).filter(Boolean);
    return { success: true, data: { role: { ...role, permissions: perms } } };
  },
  async removePermission(roleId, permissionId) {
    const idx = rolePermissions.findIndex((rp) => rp.roleId === roleId && rp.permissionId === permissionId);
    if (idx === -1) return { success: false, error: { message: 'Permission not found on role', statusCode: 404 } };
    rolePermissions.splice(idx, 1);
    return { success: true };
  },
};

const tasksApi: ApiClient['tasks'] = {
  async list(params) {
    let list = [...tasks];
    if (params?.projectId) list = list.filter((t) => t.projectId === params.projectId);
    if (params?.status) list = list.filter((t) => t.status === params.status);
    return { success: true, data: { tasks: list } };
  },
  async getMyTasks() {
    // In mock mode, return tasks assigned to user 1
    const list = tasks.filter((t) => t.assignedToUserId === 1);
    return { success: true, data: { tasks: list } };
  },
  async getById(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return { success: false, error: { message: 'Task not found', statusCode: 404 } };
    return { success: true, data: { task } };
  },
  async create(body) {
    const id = getNextId('task');
    const assignedUser = users.find((u) => u.id === body.assignedToUserId);
    const project = body.projectId ? projects.find((p) => p.id === body.projectId) : undefined;
    const task: typeof tasks[0] = {
      id,
      title: body.title!,
      description: body.description,
      projectId: body.projectId,
      assignedToUserId: body.assignedToUserId!,
      createdByUserId: 1,
      dueDate: body.dueDate,
      status: 'PENDING',
      isRecurring: body.isRecurring ?? false,
      recurringIntervalDays: body.recurringIntervalDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: project ? { id: project.id, projectName: project.projectName } : undefined,
      assignedTo: assignedUser ? { id: assignedUser.id, username: assignedUser.username, fullName: assignedUser.fullName } : undefined,
      createdBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
    };
    tasks.push(task);
    return { success: true, data: { task } };
  },
  async update(id, body) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, error: { message: 'Task not found', statusCode: 404 } };
    tasks[idx] = { ...tasks[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { task: tasks[idx] } };
  },
  async updateStatus(id, status) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, error: { message: 'Task not found', statusCode: 404 } };
    tasks[idx] = { ...tasks[idx], status: status as typeof tasks[0]['status'], updatedAt: new Date().toISOString() };
    return { success: true, data: { task: tasks[idx] } };
  },
};

const projectsApi: ApiClient['projects'] = {
  async list(params) {
    let list = [...projects];
    if (params?.customerId) list = list.filter((p) => p.customerId === params.customerId);
    return { success: true, data: { projects: list } };
  },
  async getById(id) {
    const project = projects.find((p) => p.id === id);
    if (!project) return { success: false, error: { message: 'Project not found', statusCode: 404 } };
    return { success: true, data: { project } };
  },
  async create(body) {
    const customer = customers.find((c) => c.id === body.customerId);
    if (!customer) return { success: false, error: { message: 'Customer not found', statusCode: 404 } };
    const id = getNextId('project');
    const project: typeof projects[0] = {
      id,
      projectName: body.projectName!,
      customerId: body.customerId!,
      status: (body.status as typeof projects[0]['status']) ?? 'OPEN',
      description: body.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { id: customer.id, firstName: customer.firstName, lastName: customer.lastName },
    };
    projects.push(project);
    return { success: true, data: { project } };
  },
  async update(id, body) {
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: { message: 'Project not found', statusCode: 404 } };
    projects[idx] = { ...projects[idx], ...body, updatedAt: new Date().toISOString() };
    return { success: true, data: { project: projects[idx] } };
  },
};

const workLogsApi: ApiClient['workLogs'] = {
  async list(params) {
    let list = [...workLogs];
    if (params?.userId) list = list.filter((w) => w.userId === params.userId);
    if (params?.customerId) list = list.filter((w) => w.customerId === params.customerId);
    if (params?.taskId) list = list.filter((w) => w.taskId === params.taskId);
    return { success: true, data: { workLogs: list } };
  },
  async create(body) {
    const id = getNextId('workLog');
    const customer = body.customerId ? customers.find((c) => c.id === body.customerId) : undefined;
    const task = body.taskId ? tasks.find((t) => t.id === body.taskId) : undefined;
    const wl: typeof workLogs[0] = {
      id,
      userId: 1,
      customerId: body.customerId,
      taskId: body.taskId,
      logDate: body.logDate,
      durationMinutes: body.durationMinutes,
      description: body.description,
      result: body.result,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      loggedBy: { id: 1, username: 'admin', fullName: 'مدیر سیستم' },
      customer: customer ? { id: customer.id, firstName: customer.firstName, lastName: customer.lastName } : undefined,
      task: task ? { id: task.id, title: task.title } : undefined,
    };
    workLogs.push(wl);
    return { success: true, data: { workLog: wl } };
  },
  async getByCustomer(customerId) {
    const list = workLogs.filter((w) => w.customerId === customerId);
    return { success: true, data: { workLogs: list } };
  },
};

export const mockApiClient: ApiClient = {
  auth: authApi,
  customers: customersApi,
  orders: ordersApi,
  products: productsApi,
  promotions: promotionsApi,
  campaigns: campaignsApi,
  customerLevels: customerLevelsApi,
  transactions: transactionsApi,
  users: usersApi,
  roles: rolesApi,
  tasks: tasksApi,
  projects: projectsApi,
  workLogs: workLogsApi,
};
