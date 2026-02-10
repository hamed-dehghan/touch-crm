import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface CustomerRelatedPersonnelAttributes {
  id: number;
  legalCustomerId: number;
  naturalCustomerId: number;
  position?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerRelatedPersonnelCreationAttributes
  extends Optional<CustomerRelatedPersonnelAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerRelatedPersonnel
  extends Model<CustomerRelatedPersonnelAttributes, CustomerRelatedPersonnelCreationAttributes>
  implements CustomerRelatedPersonnelAttributes
{
  declare id: number;
  declare legalCustomerId: number;
  declare naturalCustomerId: number;
  declare position?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CustomerRelatedPersonnel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    legalCustomerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'legal_customer_id',
    },
    naturalCustomerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'natural_customer_id',
    },
    position: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    tableName: 'customer_related_personnel',
    timestamps: true,
  }
);

export default CustomerRelatedPersonnel;
