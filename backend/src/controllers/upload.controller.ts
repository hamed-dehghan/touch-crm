import { Request, Response, NextFunction } from 'express';
import Customer from '../models/Customer.js';
import CustomerAttachment from '../models/CustomerAttachment.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * @swagger
 * /api/v1/customers/{id}/profile-image:
 *   post:
 *     summary: Upload profile image / logo for a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded
 */
export const uploadProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded', statusCode: 400 } });
      return;
    }

    const profileImageUrl = `/uploads/profiles/${file.filename}`;
    await customer.update({ profileImageUrl });

    res.json({
      success: true,
      data: { profileImageUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}/attachments:
 *   post:
 *     summary: Upload attachments for a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Attachments uploaded
 */
export const uploadAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    const files = (req as any).files as Array<{ originalname: string; filename: string; mimetype: string }>;
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: { message: 'No files uploaded', statusCode: 400 } });
      return;
    }

    const attachments = await CustomerAttachment.bulkCreate(
      files.map((file) => ({
        customerId: customer.id,
        fileName: file.originalname,
        filePath: `/uploads/attachments/${file.filename}`,
        fileType: file.mimetype,
      }))
    );

    res.status(201).json({
      success: true,
      data: { attachments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/customers/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete a customer attachment
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attachment deleted
 */
export const deleteAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, attachmentId } = req.params;

    const attachment = await CustomerAttachment.findOne({
      where: { id: attachmentId, customerId: id },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    await attachment.destroy();

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
