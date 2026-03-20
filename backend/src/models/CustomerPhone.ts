import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum PhoneType {
  MOBILE = 'MOBILE',
  LANDLINE = 'LANDLINE',
}

interface CustomerPhoneAttributes {
  id: number;
  customerId: number;
  phoneNumber: string;
  phoneType: PhoneType;
  label?: string;
  extension?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerPhoneCreationAttributes
  extends Optional<CustomerPhoneAttributes, 'id' | 'phoneType' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

class CustomerPhone
  extends Model<CustomerPhoneAttributes, CustomerPhoneCreationAttributes>
  implements CustomerPhoneAttributes
{
  declare id: number;
  declare customerId: number;
  declare phoneNumber: string;
  declare phoneType: PhoneType;
  declare label?: string;
  declare extension?: string;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CustomerPhone.init(
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
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'phone_number',
    },
    phoneType: {
      type: DataTypes.ENUM(...Object.values(PhoneType)),
      allowNull: false,
      defaultValue: PhoneType.MOBILE,
      field: 'phone_type',
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    extension: {
      type: DataTypes.STRING(10),
      allowNull: true,
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
    tableName: 'customer_phones',
    timestamps: true,
  }
);

export default CustomerPhone;
