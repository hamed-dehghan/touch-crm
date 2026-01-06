import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { NotFoundError } from '../utils/errors';
import { createProductSchema, updateProductSchema } from '../validations/product.validation';

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
 *     responses:
 *       200:
 *         description: List of products
 */
export const getProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        products,
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
