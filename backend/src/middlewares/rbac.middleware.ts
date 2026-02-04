import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';

/**
 * Middleware to check if the authenticated user has a specific permission
 * @param actionCode - The permission action code (e.g., 'customers:create', 'orders:delete')
 * @returns Express middleware function
 */
export const requirePermission = (actionCode: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const { roleId, userId } = req.user;

      // Check if user's role has the required permission
      const permission = await Permission.findOne({
        where: { actionCode },
      });

      if (!permission) {
        throw new ForbiddenError(`Permission '${actionCode}' not found`);
      }

      const hasPermission = await RolePermission.findOne({
        where: {
          roleId,
          permissionId: permission.id,
        },
      });

      if (!hasPermission) {
        throw new ForbiddenError(`You don't have permission to perform: ${actionCode}`);
      }

      // For _own permissions, store userId for later filtering
      if (actionCode.includes('_own')) {
        req.user.userId = userId;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to check if user has any of the provided permissions
 * @param actionCodes - Array of permission action codes
 * @returns Express middleware function
 */
export const requireAnyPermission = (actionCodes: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const { roleId, userId } = req.user;

      // Get all permissions
      const permissions = await Permission.findAll({
        where: {
          actionCode: actionCodes,
        },
      });

      if (permissions.length === 0) {
        throw new ForbiddenError('None of the required permissions found');
      }

      // Check if user has at least one of the permissions
      const permissionIds = permissions.map((p: any) => p.id);
      const hasPermission = await RolePermission.findOne({
        where: {
          roleId,
          permissionId: permissionIds,
        },
      });

      if (!hasPermission) {
        throw new ForbiddenError('You don\'t have any of the required permissions');
      }

      // For _own permissions, store userId for later filtering
      const matchedPermission = permissions.find((p: any) => hasPermission.permissionId === p.id);
      if (matchedPermission?.actionCode.includes('_own')) {
        req.user.userId = userId;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
