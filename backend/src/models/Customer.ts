import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum CustomerStatus {
  LEAD = 'LEAD',
  OPPORTUNITY = 'OPPORTUNITY',
  CUSTOMER = 'CUSTOMER',
}

export enum CustomerType {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY',
}

interface CustomerAttributes {
  id: number;
  firstName?: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  birthDate?: Date;
  status: CustomerStatus;
  customerType: CustomerType;
  companyName?: string;
  address?: string;
  website?: string;
  customerLevelId?: number;
  referredByCustomerId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerCreationAttributes
  extends Optional<CustomerAttributes, 'id' | 'status' | 'customerType' | 'createdAt' | 'updatedAt'> {}

class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  declare id: number;
  declare firstName?: string;
  declare lastName: string;
  declare phoneNumber: string;
  declare email?: string;
  declare birthDate?: Date;
  declare status: CustomerStatus;
  declare customerType: CustomerType;
  declare companyName?: string;
  declare address?: string;
  declare website?: string;
  declare customerLevelId?: number;
  declare referredByCustomerId?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
    },
    phoneNumber: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      field: 'phone_number',
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'birth_date',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CustomerStatus)),
      allowNull: false,
      defaultValue: CustomerStatus.LEAD,
    },
    customerType: {
      type: DataTypes.ENUM(...Object.values(CustomerType)),
      allowNull: false,
      defaultValue: CustomerType.PERSON,
      field: 'customer_type',
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'company_name',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customerLevelId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_level_id',
    },
    referredByCustomerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'referred_by_customer_id',
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
    tableName: 'customers',
    timestamps: true,
  }
);

export default Customer;
