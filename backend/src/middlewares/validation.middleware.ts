// backend/src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import type { AnySchema } from 'yup';
import { ValidationError as YupValidationError } from 'yup';
import { ValidationError } from '../utils/errors.js';
import { yupErrorsToDetails, type ValidationFieldDetail } from '../utils/validation.js';

export type ValidateRequestConfig = {
  body?: AnySchema;
  query?: AnySchema;
  params?: AnySchema;
};

async function validatePart(
  schema: AnySchema,
  value: unknown,
  stripUnknown: boolean
): Promise<{ details: ValidationFieldDetail[]; value?: unknown }> {
  try {
    const next = await schema.validate(value, { abortEarly: false, stripUnknown: stripUnknown });
    return { details: [], value: next };
  } catch (error) {
    if (error instanceof YupValidationError) {
      return { details: yupErrorsToDetails(error) };
    }
    throw error;
  }
}

function prefixFields(details: ValidationFieldDetail[], prefix: string): ValidationFieldDetail[] {
  return details.map((d) => ({
    field: d.field === '_form' ? '_form' : `${prefix}${d.field}`,
    message: d.message,
  }));
}

/** Validate body (strip unknown), query, and/or params; assign coerced results back to `req`. */
export const validateRequest = (config: ValidateRequestConfig) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const merged: ValidationFieldDetail[] = [];

      if (config.body) {
        const { details, value } = await validatePart(config.body, req.body, true);
        if (details.length) merged.push(...details);
        else if (value !== undefined) req.body = value;
      }

      if (config.query) {
        const { details, value } = await validatePart(config.query, req.query, true);
        if (details.length) merged.push(...prefixFields(details, 'query.'));
        else if (value !== undefined && typeof value === 'object' && value !== null) {
          Object.assign(req.query, value as object);
        }
      }

      if (config.params) {
        const { details, value } = await validatePart(config.params, req.params, true);
        if (details.length) merged.push(...prefixFields(details, 'params.'));
        else if (value !== undefined && typeof value === 'object' && value !== null) {
          Object.assign(req.params, value as object);
        }
      }

      if (merged.length) {
        const message = merged.map((d) => d.message).join('، ');
        throw new ValidationError(message, merged);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/** Body-only validation (strip unknown, assign coerced body). */
export const validate = (schema: AnySchema) => validateRequest({ body: schema });
