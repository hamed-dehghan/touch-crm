import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface CustomerAttachmentAttributes {
  id: number;
  customerId: number;
  fileName: string;
  filePath: string;
  fileType?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerAttachmentCreationAttributes
  extends Optional<CustomerAttachmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CustomerAttachment
  extends Model<CustomerAttachmentAttributes, CustomerAttachmentCreationAttributes>
  implements CustomerAttachmentAttributes
{
  declare id: number;
  declare customerId: number;
  declare fileName: string;
  declare filePath: string;
  declare fileType?: string;
  declare description?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CustomerAttachment.init(
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
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type',
    },
    description: {
      type: DataTypes.STRING(500),
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
    tableName: 'customer_attachments',
    timestamps: true,
  }
);

export default CustomerAttachment;
