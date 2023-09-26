import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { CustomError } from '../errors';
import { logger } from '../utils/loggerUtils';

/**
 * Middleware for error handling
 * @param error The error object
 * @param req The express request
 * @param res The Express response
 * @param next
 * @returns
 */
export const errorMiddleware = (
  error: ErrorRequestHandler,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  logger.error(error);
  if (error instanceof CustomError) {
    if (typeof error.statusCode === 'number') {
      res.status(error.statusCode).json({
        message: error.message,
        errors: error.errors,
      });

      return;
    }
  }

  res.status(500).send(
    JSON.stringify({
      message: 'Internal server error',
    })
  );
};
