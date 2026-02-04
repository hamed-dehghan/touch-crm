import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface PermissionAttributes {
  id: number;
  actionCode: string;
  description?: string;
  resource?: string;
  createdAt?: Date;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, 'id' | 'createdAt'> {}

class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  public id!: number;
  public actionCode!: string;
  public description?: string;
  public resource?: string;
  public readonly createdAt!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    actionCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'action_code',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: false,
  }
);

export default Permission;
