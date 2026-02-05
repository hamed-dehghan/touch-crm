/**
 * Mock API implementation — uses in-memory data from mockDb.
 * Matches backend API contract; swap with real client when backend is ready.
 */

import type { ApiClient, ListParams } from './client';
import type { ApiResponse, Pagination, CustomerRfmResponse, RfmScores } from '@/types/api';
import {
  users,
  roles,
  customerLevels,
  customers,
  products,
  orders,
  orderItems,
  transactions,
  promotions,
  customerPromotions,
  campaigns,
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
};
