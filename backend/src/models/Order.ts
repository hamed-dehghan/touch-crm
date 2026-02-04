import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface OrderAttributes {
  id: number;
  customerId: number;
  orderDate: Date;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  createdByUserId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes
  extends Optional<OrderAttributes, 'id' | 'orderDate' | 'discountAmount' | 'taxAmount' | 'finalAmount' | 'createdByUserId' | 'createdAt' | 'updatedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public customerId!: number;
  public orderDate!: Date;
  public totalAmount!: number;
  public discountAmount!: number;
  public taxAmount!: number;
  public finalAmount!: number;
  public createdByUserId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
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
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'order_date',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'total_amount',
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'discount_amount',
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'tax_amount',
    },
    finalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'final_amount',
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by_user_id',
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
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;
