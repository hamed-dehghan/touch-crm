import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { toPersianErrorMessage } from '../utils/errorMessages.js';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    const message = toPersianErrorMessage(err.message, err.statusCode);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message,
        statusCode: err.statusCode,
        code: err.code,
        details: err.details,
      },
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  const fallbackMessage = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return res.status(500).json({
    success: false,
    error: {
      message: toPersianErrorMessage(fallbackMessage, 500),
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    },
  });
};
