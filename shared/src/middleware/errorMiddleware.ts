import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { CustomError } from '../errors';

/**
 * Middleware for error handling
 * @param error The error object
 * @param req The Express request
 * @param res The Express response
 * @param next
 * @returns
 */
export const errorMiddleware: ErrorRequestHandler = (error: Error, _: Request, res: Response, _next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof CustomError) {
    res.status(error.statusCode as number).json({
      message: error.message,
      errors: error.errors,
      stack: isDevelopment ? error.stack : undefined,
    });
    return;
  }

  res.status(500).send(isDevelopment ? { message: error.message } : { message: 'Internal server error' });
};
