import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import { NotFoundError, ValidationError } from '';
import { hashPassword } from '';
import { registerSchema } from '';

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get list of users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
    const users = await User.findAll({
      attributes: ['id', 'username', 'fullName', 'email', 'roleId', 'isActive', 'createdAt'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'roleName'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users,
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
