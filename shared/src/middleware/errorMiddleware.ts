import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { CustomError } from '../errors';
import { readConfiguration } from '../utils/configUtils';
import { formatError } from '../utils/errorUtils';
import { logger } from '../utils/loggerUtils';

/**
 * Middleware for error handling
 * @param error The error object
 * @param req The Express request
 * @param res The Express response
 * @param next
 * @returns
 */
export const errorMiddleware: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const config = readConfiguration();
  // NODE_ENV is the only thing that should expose stack traces to the caller.
  // DEBUG_MODE is a separate, log-only switch - it used to be read from
  // featOrdersyncActive here, which has nothing to do with debugging.
  const isDevelopment = process.env.NODE_ENV === 'development' || config.debugmode?.toLowerCase() === 'true';

  const statusCode = error instanceof CustomError ? error.statusCode : 500;

  // Every request that ends here used to disappear without a trace, which is
  // what made failures in the order sync impossible to diagnose.
  const route = `${req?.method ?? '-'} ${req?.originalUrl ?? '-'}`;
  const context = { method: req?.method, path: req?.originalUrl, statusCode, error: formatError(error) };
  if (statusCode >= 500) {
    logger.error(`Unhandled error for ${route}`, context);
  } else {
    logger.warn(`Request failed for ${route}`, context);
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
