import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';
import { registerSchema } from '../validations/auth.validation.js';
import { getBasicSearchString, orILike, parsePagination } from '../utils/search.utils.js';

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get list of users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         description: Basic search on username, full name, email
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Same as `q` (legacy)
 *         schema:
 *           type: string
 *       - in: query
 *         name: roleId
 *         description: Advanced filter
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         description: Advanced filter
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
 *     responses:
 *       200:
 *         description: List of users
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = getBasicSearchString(req.query as Record<string, unknown>);
    const { roleId, isActive } = req.query;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (roleId !== undefined && roleId !== '') {
      where.roleId = Number(roleId);
    }
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const searchWhere =
      q
        ? {
            [Op.and]: [where, orILike(['username', 'fullName', 'email'], q)],
          }
        : where;

    const { count, rows } = await User.findAndCountAll({
      where: searchWhere,
      attributes: ['id', 'username', 'fullName', 'email', 'roleId', 'isActive', 'createdAt'],
      limit,
      offset,
      include: [{ model: Role, as: 'role', attributes: ['id', 'roleName'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users: rows,
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
 * /api/v1/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: User created successfully
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await registerSchema.validate(req.body);

    const { username, password, fullName, email, roleId } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new ValidationError('Username already exists');
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new ValidationError('Invalid role ID');
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username,
      passwordHash,
      fullName,
      email,
      roleId,
      isActive: true,
    });

    const createdUser = await User.findByPk(user.id, {
      attributes: ['id', 'username', 'fullName', 'email', 'roleId', 'isActive'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'roleName'] }],
    });

    res.status(201).json({
      success: true,
      data: {
        user: createdUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
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
 *         description: User updated successfully
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, fullName, roleId, isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        throw new ValidationError('Username already exists');
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new ValidationError('Email already exists');
      }
    }

    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new ValidationError('Invalid role ID');
      }
    }

    await user.update({
      username: username || user.username,
      email: email || user.email,
      fullName: fullName !== undefined ? fullName : user.fullName,
      roleId: roleId || user.roleId,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'username', 'fullName', 'email', 'roleId', 'isActive'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'roleName'] }],
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent deleting yourself
    if (req.user && user.id === req.user.userId) {
      throw new ValidationError('Cannot delete your own account');
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawIds = Array.isArray(req.body?.ids) ? req.body.ids : null;
    if (!rawIds || rawIds.length === 0) {
      throw new ValidationError('ids must be a non-empty array');
    }

    const ids = [...new Set(rawIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0))];
    if (ids.length !== rawIds.length) {
      throw new ValidationError('ids must contain valid unique positive integers');
    }

    if (req.user && ids.includes(req.user.userId)) {
      throw new ValidationError('Cannot delete your own account');
    }

    const users = await User.findAll({
      where: { id: ids },
      attributes: ['id'],
    });
    if (users.length !== ids.length) {
      throw new ValidationError('One or more users were not found');
    }

    await User.destroy({ where: { id: ids } });

    res.json({
      success: true,
      data: { deletedCount: ids.length },
      message: 'Users deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
