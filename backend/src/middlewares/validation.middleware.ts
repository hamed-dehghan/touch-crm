import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'yup';
import { ValidationError } from '../utils/errors.js';

export const validate = (schema: AnySchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (error: any) {
      if (error.errors) {
        throw new ValidationError(error.errors.join(', '));
      }
      throw new ValidationError(error.message || 'Validation failed');
    }
  };
};
