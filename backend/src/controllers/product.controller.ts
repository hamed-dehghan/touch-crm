import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Product from '../models/Product.js';
import { NotFoundError } from '../utils/errors.js';
import { createProductSchema, updateProductSchema } from '../validations/product.validation.js';
import { getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';
import {
  parseProductFiltersQuery,
  parseProductListOrder,
  whereFragmentsFromProductFilters,
} from '../utils/productFilter.utils.js';

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - price
 *             properties:
 *               productName:
 *                 type: string
 *               price:
 *                 type: number
 *               taxRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await createProductSchema.validate(req.body);

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get list of products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search on product name (preferred over `search`)
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         description: Advanced filter — minimum unit price
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         description: Advanced filter — maximum unit price
 *         schema:
 *           type: number
 *       - in: query
 *         name: filters
 *         description: JSON array of filter tokens from the filter bar — `[{"key":"productName","operator":"contains","value":"..."}]` (keys productName, price, taxRate, createdAt)
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         description: Sort field (whitelist id, productName, price, taxRate, createdAt)
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         description: asc or desc (default desc when omitted)
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of products
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { minPrice, maxPrice } = req.query;
    const filterTokens = parseProductFiltersQuery(
      (req.query as Record<string, unknown>).filters
    );

    const conditions: Record<string, unknown>[] = [];

    if (q) {
      conditions.push(orILike(['productName'], q));
    }

    const priceBounds: Record<string | symbol, number> = {};
    if (minPrice !== undefined && minPrice !== '') {
      const n = Number(minPrice);
      if (!Number.isNaN(n)) priceBounds[Op.gte] = n;
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const n = Number(maxPrice);
      if (!Number.isNaN(n)) priceBounds[Op.lte] = n;
    }
    if (Object.keys(priceBounds).length > 0) {
      conditions.push({ price: priceBounds });
    }

    conditions.push(...whereFragmentsFromProductFilters(filterTokens));

    const where: Record<string, unknown> =
      conditions.length === 0
        ? {}
        : conditions.length === 1
          ? conditions[0]
          : { [Op.and]: conditions };

    const order = parseProductListOrder(req.query as Record<string, unknown>);

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order,
    });

    res.json({
      success: true,
      data: {
        products: rows,
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
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
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
 *         description: Product details
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    res.json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *         description: Product updated successfully
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await updateProductSchema.validate(req.body);

    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    await product.update(req.body);

    res.json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
