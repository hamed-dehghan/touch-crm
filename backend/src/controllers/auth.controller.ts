import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const user = await User.findOne({ where: { username } });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          roleId: user.roleId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, fullName, email, roleId } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new ValidationError('Username already exists');
    }

    // Hash password before storing (security requirement)
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      username,
      passwordHash: hashedPassword,
      fullName,
      email,
      roleId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          roleId: user.roleId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          roleId: user.roleId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
