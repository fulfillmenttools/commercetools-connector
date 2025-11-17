import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { CustomError } from '../errors';
import { readConfiguration } from '../utils/configUtils';
import { logger } from '../utils/loggerUtils';

/**
 * Middleware for error handling
 * @param error The error object
 * @param req The Express request
 * @param res The Express response
 * @param next
 * @returns
 */
export const errorMiddleware: ErrorRequestHandler = (error: Error, _: Request, res: Response, _next: NextFunction) => {
  let isDevelopment = process.env.NODE_ENV === 'development';
  const config = readConfiguration();

  if (config.featOrdersyncActive.toLowerCase() === "true") { // FeatureFlag: Disables the Order Sync from ct to fft
    logger.error('--- Debug Mode active ---');
    isDevelopment = true;
  }

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      message: error.message,
      errors: error.errors,
      stack: isDevelopment ? error.stack : undefined,
    });
    return;
  }

  res.status(500).send(isDevelopment ? { message: error.message } : { message: 'Internal server error' });
};
