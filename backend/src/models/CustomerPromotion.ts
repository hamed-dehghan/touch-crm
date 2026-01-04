import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CustomerPromotionAttributes {
  id: number;
  customerId: number;
  promotionId: number;
  assignedAt: Date;
  expiryDate?: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerPromotionCreationAttributes
  extends Optional<CustomerPromotionAttributes, 'id' | 'assignedAt' | 'isUsed' | 'createdAt' | 'updatedAt'> {}

class CustomerPromotion
  extends Model<CustomerPromotionAttributes, CustomerPromotionCreationAttributes>
  implements CustomerPromotionAttributes
{
  public id!: number;
  public customerId!: number;
  public promotionId!: number;
  public assignedAt!: Date;
  public expiryDate?: Date;
  public isUsed!: boolean;
  public usedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerPromotion.init(
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
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'promotion_id',
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'assigned_at',
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expiry_date',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_used',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
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
    tableName: 'customer_promotions',
    timestamps: true,
  }
);

export default CustomerPromotion;
