import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum CustomerStatus {
  LEAD = 'LEAD',
  OPPORTUNITY = 'OPPORTUNITY',
  CUSTOMER = 'CUSTOMER',
  LOST = 'LOST',
}

export enum CustomerType {
  NATURAL = 'NATURAL',
  LEGAL = 'LEGAL',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum RelationshipType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  AGENT = 'AGENT',
  COMPETITOR = 'COMPETITOR',
  INTERNAL_STAFF = 'INTERNAL_STAFF',
}

export enum AcquisitionChannel {
  INSTAGRAM = 'INSTAGRAM',
  EXHIBITION = 'EXHIBITION',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  EVENT = 'EVENT',
  PREVIOUS_ACQUAINTANCE = 'PREVIOUS_ACQUAINTANCE',
  OTHER = 'OTHER',
}

interface CustomerAttributes {
  id: number;
  customerCode: string;
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  brandName?: string;
  isActive: boolean;
  prefix?: string;
  gender?: Gender;
  email?: string;
  website?: string;
  status: CustomerStatus;
  relationshipType: RelationshipType;
  acquisitionChannel?: AcquisitionChannel;
  customerLevelId?: number;
  referredByCustomerId?: number;
  interests?: string;
  psychology?: string;
  catchphrases?: string;
  notablePoints?: string;
  birthDate?: Date;
  weddingAnniversary?: Date;
  profileImageUrl?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerCreationAttributes
  extends Optional<
    CustomerAttributes,
    'id' | 'status' | 'customerType' | 'isActive' | 'relationshipType' | 'createdAt' | 'updatedAt'
  > {}

class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  declare id: number;
  declare customerCode: string;
  declare customerType: CustomerType;
  declare firstName?: string;
  declare lastName?: string;
  declare companyName?: string;
  declare brandName?: string;
  declare isActive: boolean;
  declare prefix?: string;
  declare gender?: Gender;
  declare email?: string;
  declare website?: string;
  declare status: CustomerStatus;
  declare relationshipType: RelationshipType;
  declare acquisitionChannel?: AcquisitionChannel;
  declare customerLevelId?: number;
  declare referredByCustomerId?: number;
  declare interests?: string;
  declare psychology?: string;
  declare catchphrases?: string;
  declare notablePoints?: string;
  declare birthDate?: Date;
  declare weddingAnniversary?: Date;
  declare profileImageUrl?: string;
  declare description?: string;
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
    customerCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'customer_code',
    },
    customerType: {
      type: DataTypes.ENUM(...Object.values(CustomerType)),
      allowNull: false,
      defaultValue: CustomerType.NATURAL,
      field: 'customer_type',
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name',
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'company_name',
    },
    brandName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'brand_name',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    prefix: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM(...Object.values(Gender)),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CustomerStatus)),
      allowNull: false,
      defaultValue: CustomerStatus.LEAD,
    },
    relationshipType: {
      type: DataTypes.ENUM(...Object.values(RelationshipType)),
      allowNull: false,
      defaultValue: RelationshipType.CUSTOMER,
      field: 'relationship_type',
    },
    acquisitionChannel: {
      type: DataTypes.ENUM(...Object.values(AcquisitionChannel)),
      allowNull: true,
      field: 'acquisition_channel',
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
    interests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    psychology: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    catchphrases: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notablePoints: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notable_points',
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'birth_date',
    },
    weddingAnniversary: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'wedding_anniversary',
    },
    profileImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_image_url',
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'customers',
    timestamps: true,
  }
);

export default Customer;
