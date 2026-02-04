import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface RolePermissionAttributes {
  roleId: number;
  permissionId: number;
  createdAt?: Date;
}

interface RolePermissionCreationAttributes
  extends Optional<RolePermissionAttributes, 'createdAt'> {}

class RolePermission
  extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes
{
  public roleId!: number;
  public permissionId!: number;
  public readonly createdAt!: Date;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'role_id',
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'permission_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    timestamps: false,
  }
);

export default RolePermission;
