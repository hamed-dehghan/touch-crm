import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const UPLOADS_DIR = path.resolve('uploads');
const PROFILE_DIR = path.join(UPLOADS_DIR, 'profiles');
const ATTACHMENTS_DIR = path.join(UPLOADS_DIR, 'attachments');

/**
 * Multer storage configuration for profile images
 */
const profileStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, PROFILE_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

/**
 * Multer storage configuration for customer attachments
 */
const attachmentStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, ATTACHMENTS_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  },
});

/** File filter: accept only images for profile uploads */
const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).single('profileImage');

export const uploadAttachments = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).array('files', 10); // max 10 files at once

export { UPLOADS_DIR, PROFILE_DIR, ATTACHMENTS_DIR };
