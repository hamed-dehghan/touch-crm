import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import User from '../models/User.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get list of roles with permission counts
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
export const getRoles = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'actionCode'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const rolesWithCount = roles.map((role: any) => ({
      id: role.id,
      roleName: role.roleName,
      description: role.description,
      permissionCount: role.permissions?.length || 0,
      permissions: role.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        roles: rolesWithCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role details with all permissions
 *     tags: [Roles]
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
 *         description: Role details
 */
export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'actionCode', 'description', 'resource'],
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new NotFoundError('Role');
    }

    res.json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roleName, description } = req.body;

    if (!roleName) {
      throw new ValidationError('Role name is required');
    }

    const existingRole = await Role.findOne({ where: { roleName } });
    if (existingRole) {
      throw new ValidationError('Role name already exists');
    }

    const role = await Role.create({
      roleName,
      description,
    });

    res.status(201).json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   put:
 *     summary: Update role name/description
 *     tags: [Roles]
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
 *         description: Role updated successfully
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { roleName, description } = req.body;

    const role = await Role.findByPk(id);

    if (!role) {
      throw new NotFoundError('Role');
    }

    if (roleName && roleName !== role.roleName) {
      const existingRole = await Role.findOne({ where: { roleName } });
      if (existingRole) {
        throw new ValidationError('Role name already exists');
      }
    }

    await role.update({
      roleName: roleName || role.roleName,
      description: description !== undefined ? description : role.description,
    });

    res.json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete role (if no users assigned)
 *     tags: [Roles]
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
 *         description: Role deleted successfully
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [{ model: User, as: 'users' }],
    });

    if (!role) {
      throw new NotFoundError('Role');
    }

    // Check if any users are assigned to this role
    if ((role as any).users && (role as any).users.length > 0) {
      throw new ValidationError('Cannot delete role with assigned users');
    }

    await role.destroy();

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: List all available permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
export const getPermissions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await Permission.findAll({
      order: [['resource', 'ASC'], ['actionCode', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}/permissions:
 *   post:
 *     summary: Assign permissions to role
 *     tags: [Roles]
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
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 */
export const assignPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      throw new ValidationError('permissionIds must be an array');
    }

    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('Role');
    }

    // Verify all permissions exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ValidationError('One or more permission IDs are invalid');
    }

    // Remove existing permissions
    await RolePermission.destroy({
      where: { roleId: id },
    });

    // Add new permissions
    await RolePermission.bulkCreate(
      permissionIds.map((permissionId: number) => ({
        roleId: parseInt(id),
        permissionId,
      }))
    );

    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'actionCode', 'description'],
          through: { attributes: [] },
        },
      ],
    });

    res.json({
      success: true,
      data: {
        role: updatedRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/roles/{id}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove permission from role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission removed successfully
 */
export const removePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, permissionId } = req.params;

    const rolePermission = await RolePermission.findOne({
      where: {
        roleId: id,
        permissionId: permissionId,
      },
    });

    if (!rolePermission) {
      throw new NotFoundError('Role permission');
    }

    await rolePermission.destroy();

    res.json({
      success: true,
      message: 'Permission removed from role successfully',
    });
  } catch (error) {
    next(error);
  }
};
