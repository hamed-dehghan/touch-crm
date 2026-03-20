import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Customer, { CustomerStatus } from '../models/Customer.js';
import CustomerLevel from '../models/CustomerLevel.js';
import CustomerPhone from '../models/CustomerPhone.js';
import CustomerAddress from '../models/CustomerAddress.js';
import CustomerSocialMedia from '../models/CustomerSocialMedia.js';
import CustomerAttachment from '../models/CustomerAttachment.js';
import CustomerRelatedPersonnel from '../models/CustomerRelatedPersonnel.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createCustomerSchema, updateCustomerSchema } from '../validations/customer.validation.js';
import { checkPromotionsForReferral, checkPromotionsAfterLevelChange } from '../services/promotionEvents.service.js';
import { sendWelcomeMessage } from '../services/automatedMessages.service.js';

/**
 * Helper: all child model includes for eager loading
 */
const customerChildIncludes = [
  { model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName'] },
  { model: CustomerPhone, as: 'phones' },
  { model: CustomerAddress, as: 'addresses' },
  { model: CustomerSocialMedia, as: 'socialMedia' },
  { model: CustomerAttachment, as: 'attachments' },
  {
    model: CustomerRelatedPersonnel,
    as: 'relatedPersonnel',
    include: [
      { model: Customer, as: 'naturalCustomer', attributes: ['id', 'firstName', 'lastName', 'customerCode'] },
    ],
  },
];

/**
 * Helper: generate unique customer code like C-00001
 */
async function generateCustomerCode(): Promise<string> {
  const lastCustomer = await Customer.findOne({
    order: [['id', 'DESC']],
    attributes: ['id'],
  });
  const nextNum = (lastCustomer?.id ?? 0) + 1;
  return `C-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Helper: sync child records (upsert existing, create new, delete removed)
 */
async function syncChildRecords<T extends { id?: number }>(
  Model: any,
  customerId: number,
  foreignKeyField: string,
  incomingRecords: T[] | undefined,
  transaction: any
): Promise<void> {
  if (incomingRecords === undefined) return;

  // Get existing IDs
  const existing = await Model.findAll({
    where: { [foreignKeyField]: customerId },
    attributes: ['id'],
    transaction,
  });
  const existingIds = new Set<number>(existing.map((r: any) => r.id as number));
  const incomingIds = new Set<number>(
    incomingRecords.filter((r): r is T & { id: number } => r.id != null).map((r) => r.id)
  );

  // Delete records that are no longer present
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await Model.destroy({ where: { id: toDelete }, transaction });
  }

  // Upsert records
  for (const record of incomingRecords) {
    const data = { ...record, [foreignKeyField]: customerId };
    if (record.id && existingIds.has(record.id)) {
      await Model.update(data, { where: { id: record.id }, transaction });
    } else {
      delete data.id;
      await Model.create(data, { transaction });
    }
  }
}

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerType:
 *                 type: string
 *                 enum: [NATURAL, LEGAL]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               brandName:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [LEAD, OPPORTUNITY, CUSTOMER, LOST]
 *               phones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                     phoneType:
 *                       type: string
 *                       enum: [MOBILE, LANDLINE]
 *                     isDefault:
 *                       type: boolean
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     province:
 *                       type: string
 *                     city:
 *                       type: string
 *                     address:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *               socialMedia:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     profileUrl:
 *                       type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    await createCustomerSchema.validate(req.body);

    const { phones, addresses, socialMedia, relatedPersonnel, email, ...customerData } = req.body;

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Customer.findOne({ where: { email }, transaction: t });
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    // Auto-generate customer code
    const customerCode = await generateCustomerCode();

    const customer = await Customer.create(
      {
        ...customerData,
        email: email || undefined,
        customerCode,
        status: customerData.status || CustomerStatus.LEAD,
      },
      { transaction: t }
    );

    // Create child records
    if (phones && phones.length > 0) {
      await CustomerPhone.bulkCreate(
        phones.map((p: any) => ({ ...p, customerId: customer.id })),
        { transaction: t }
      );
    }

    if (addresses && addresses.length > 0) {
      await CustomerAddress.bulkCreate(
        addresses.map((a: any) => ({ ...a, customerId: customer.id })),
        { transaction: t }
      );
    }

    if (socialMedia && socialMedia.length > 0) {
      await CustomerSocialMedia.bulkCreate(
        socialMedia.map((s: any) => ({ ...s, customerId: customer.id })),
        { transaction: t }
      );
    }

    if (relatedPersonnel && relatedPersonnel.length > 0) {
      await CustomerRelatedPersonnel.bulkCreate(
        relatedPersonnel.map((rp: any) => ({ ...rp, legalCustomerId: customer.id })),
        { transaction: t }
      );
    }

    await t.commit();

    // Fetch full customer with all relations
    const createdCustomer = await Customer.findByPk(customer.id, {
      include: customerChildIncludes,
    });

    // Check for referral promotions (async, non-blocking)
    if (customer.referredByCustomerId) {
      checkPromotionsForReferral(customer.id).catch((error) => {
        console.error('Error checking referral promotions:', error);
      });
    }

    // Send welcome message if customer status is CUSTOMER (async, non-blocking)
    if (customer.status === CustomerStatus.CUSTOMER) {
      sendWelcomeMessage(customer.id).catch((error) => {
        console.error('Error sending welcome message:', error);
      });
    }

    res.status(201).json({
      success: true,
      data: {
        customer: createdCustomer,
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: Get list of customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerType
 *         schema:
 *           type: string
 *           enum: [NATURAL, LEGAL]
 *       - in: query
 *         name: relationshipType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customers
 */
export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const { status, search, customerType, relationshipType, isActive } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (relationshipType) {
      where.relationshipType = relationshipType;
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
        { brandName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { customerCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName'] },
        { model: CustomerPhone, as: 'phones', where: { isDefault: true }, required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        customers: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID with all related data
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer details with all child records
 *       404:
 *         description: Customer not found
 */
export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        { model: CustomerLevel, as: 'customerLevel', attributes: ['id', 'levelName', 'minScore', 'maxScore'] },
        { model: CustomerPhone, as: 'phones' },
        { model: CustomerAddress, as: 'addresses' },
        { model: CustomerSocialMedia, as: 'socialMedia' },
        { model: CustomerAttachment, as: 'attachments' },
        {
          model: CustomerRelatedPersonnel,
          as: 'relatedPersonnel',
          include: [
            { model: Customer, as: 'naturalCustomer', attributes: ['id', 'firstName', 'lastName', 'customerCode'] },
          ],
        },
      ],
    });

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    res.json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer with nested child records
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    await updateCustomerSchema.validate(req.body);

    const { id } = req.params;
    const { phones, addresses, socialMedia, relatedPersonnel, email, ...customerData } = req.body;

    const customer = await Customer.findByPk(id, { transaction: t });

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    // Check if email is being changed and already exists
    if (email && email !== customer.email) {
      const existingEmail = await Customer.findOne({ where: { email }, transaction: t });
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    const oldLevelId = customer.customerLevelId;

    // Update main customer record
    await customer.update(
      { ...customerData, email: email !== undefined ? email : customer.email },
      { transaction: t }
    );

    // Sync child records
    await syncChildRecords(CustomerPhone, customer.id, 'customerId', phones, t);
    await syncChildRecords(CustomerAddress, customer.id, 'customerId', addresses, t);
    await syncChildRecords(CustomerSocialMedia, customer.id, 'customerId', socialMedia, t);
    await syncChildRecords(
      CustomerRelatedPersonnel,
      customer.id,
      'legalCustomerId',
      relatedPersonnel,
      t
    );

    await t.commit();

    // Fetch updated customer with all relations
    const updatedCustomer = await Customer.findByPk(id, {
      include: customerChildIncludes,
    });

    // Check for promotions if level changed (async, non-blocking)
    if (customerData.customerLevelId && customerData.customerLevelId !== oldLevelId) {
      checkPromotionsAfterLevelChange(parseInt(id)).catch((error) => {
        console.error('Error checking promotions after level change:', error);
      });
    }

    res.json({
      success: true,
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer (and all child records via CASCADE)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    await customer.destroy();

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
