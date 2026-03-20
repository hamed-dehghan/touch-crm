import * as yup from 'yup';
import {
  CustomerStatus,
  CustomerType,
  Gender,
  RelationshipType,
  AcquisitionChannel,
} from '../models/Customer.js';
import { PhoneType } from '../models/CustomerPhone.js';
import { SocialMediaPlatform } from '../models/CustomerSocialMedia.js';

// -- Nested child schemas --

const phoneSchema = yup.object().shape({
  id: yup.number().integer().positive(),
  phoneNumber: yup.string().max(20).required('Phone number is required'),
  phoneType: yup.string().oneOf(Object.values(PhoneType)),
  label: yup.string().max(100),
  extension: yup.string().max(10),
  isDefault: yup.boolean(),
});

const addressSchema = yup.object().shape({
  id: yup.number().integer().positive(),
  province: yup.string().max(100),
  city: yup.string().max(100),
  address: yup.string(),
  postalCode: yup.string().max(10),
  isDefault: yup.boolean(),
});

const socialMediaSchema = yup.object().shape({
  id: yup.number().integer().positive(),
  platform: yup.string().oneOf(Object.values(SocialMediaPlatform)).required('Platform is required'),
  profileUrl: yup.string().max(500).required('Profile URL is required'),
});

const relatedPersonnelSchema = yup.object().shape({
  id: yup.number().integer().positive(),
  naturalCustomerId: yup.number().integer().positive().required('Natural customer ID is required'),
  position: yup.string().max(200),
});

// -- Main customer schemas --

export const createCustomerSchema = yup.object().shape({
  // Identity
  customerType: yup.string().oneOf(Object.values(CustomerType)),
  firstName: yup.string().max(100),
  lastName: yup.string().max(100),
  companyName: yup.string().max(255),
  brandName: yup.string().max(255),
  isActive: yup.boolean(),
  prefix: yup.string().max(50),
  gender: yup.string().oneOf(Object.values(Gender)),

  // Contact
  email: yup.string().email('Invalid email format').max(150),
  website: yup.string().url('Invalid URL format').max(255),

  // Marketing / Supplementary
  status: yup.string().oneOf(Object.values(CustomerStatus)),
  relationshipType: yup.string().oneOf(Object.values(RelationshipType)),
  acquisitionChannel: yup.string().oneOf(Object.values(AcquisitionChannel)),
  customerLevelId: yup.number().integer().positive(),
  referredByCustomerId: yup.number().integer().positive(),

  // Psychology / Notes
  interests: yup.string(),
  psychology: yup.string(),
  catchphrases: yup.string(),
  notablePoints: yup.string(),
  birthDate: yup.date(),
  weddingAnniversary: yup.date(),

  // Documents
  profileImageUrl: yup.string().max(500),
  description: yup.string(),

  // Nested child records
  phones: yup.array().of(phoneSchema),
  addresses: yup.array().of(addressSchema),
  socialMedia: yup.array().of(socialMediaSchema),
  relatedPersonnel: yup.array().of(relatedPersonnelSchema),
});

export const updateCustomerSchema = yup.object().shape({
  // Identity
  customerType: yup.string().oneOf(Object.values(CustomerType)),
  firstName: yup.string().max(100),
  lastName: yup.string().max(100),
  companyName: yup.string().max(255),
  brandName: yup.string().max(255),
  isActive: yup.boolean(),
  prefix: yup.string().max(50),
  gender: yup.string().oneOf(Object.values(Gender)),

  // Contact
  email: yup.string().email('Invalid email format').max(150),
  website: yup.string().url('Invalid URL format').max(255),

  // Marketing / Supplementary
  status: yup.string().oneOf(Object.values(CustomerStatus)),
  relationshipType: yup.string().oneOf(Object.values(RelationshipType)),
  acquisitionChannel: yup.string().oneOf(Object.values(AcquisitionChannel)),
  customerLevelId: yup.number().integer().positive(),
  referredByCustomerId: yup.number().integer().positive(),

  // Psychology / Notes
  interests: yup.string(),
  psychology: yup.string(),
  catchphrases: yup.string(),
  notablePoints: yup.string(),
  birthDate: yup.date(),
  weddingAnniversary: yup.date(),

  // Documents
  profileImageUrl: yup.string().max(500),
  description: yup.string(),

  // Nested child records
  phones: yup.array().of(phoneSchema),
  addresses: yup.array().of(addressSchema),
  socialMedia: yup.array().of(socialMediaSchema),
  relatedPersonnel: yup.array().of(relatedPersonnelSchema),
});
