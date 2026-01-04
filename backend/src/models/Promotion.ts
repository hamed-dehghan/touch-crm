import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum RewardType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

interface PromotionAttributes {
  id: number;
  title: string;
  rewardType: RewardType;
  rewardValue: number;
  conditionJson: string;
  durationDays?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromotionCreationAttributes
  extends Optional<PromotionAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Promotion
  extends Model<PromotionAttributes, PromotionCreationAttributes>
  implements PromotionAttributes
{
  public id!: number;
  public title!: string;
  public rewardType!: RewardType;
  public rewardValue!: number;
  public conditionJson!: string;
  public durationDays?: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Promotion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rewardType: {
      type: DataTypes.ENUM(...Object.values(RewardType)),
      allowNull: false,
      field: 'reward_type',
    },
    rewardValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'reward_value',
    },
    conditionJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'condition_json',
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_days',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'promotions',
    timestamps: true,
  }
);

export default Promotion;
