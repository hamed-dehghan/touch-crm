import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CustomerLevelAttributes {
  id: number;
  levelName: string;
  minScore: number;
  maxScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerLevelCreationAttributes
  extends Optional<CustomerLevelAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerLevel
  extends Model<CustomerLevelAttributes, CustomerLevelCreationAttributes>
  implements CustomerLevelAttributes
{
  public id!: number;
  public levelName!: string;
  public minScore!: number;
  public maxScore!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerLevel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    levelName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'level_name',
    },
    minScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'min_score',
    },
    maxScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'max_score',
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
    tableName: 'customer_levels',
    timestamps: true,
  }
);

export default CustomerLevel;
