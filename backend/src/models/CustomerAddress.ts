import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface CustomerAddressAttributes {
  id: number;
  customerId: number;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerAddressCreationAttributes
  extends Optional<CustomerAddressAttributes, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

class CustomerAddress
  extends Model<CustomerAddressAttributes, CustomerAddressCreationAttributes>
  implements CustomerAddressAttributes
{
  declare id: number;
  declare customerId: number;
  declare province?: string;
  declare city?: string;
  declare address?: string;
  declare postalCode?: string;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CustomerAddress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customer_id',
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'postal_code',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'customer_addresses',
    timestamps: true,
  }
);

export default CustomerAddress;
