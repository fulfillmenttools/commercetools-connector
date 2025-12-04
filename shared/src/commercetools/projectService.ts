import { Project } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client';
import { CustomError } from '../errors';
import { logger } from '../utils';
import { statusCode } from './statusCode';

export async function getProject(): Promise<Project> {
  try {
    const result = await createApiRoot().get().execute();

    if (result.statusCode === 200) {
      return result.body;
    } else {
      const errorMessage = `Cannot read CT project: ${JSON.stringify(result)}`;
      logger.error(errorMessage);
      throw new CustomError(result.statusCode || 500, errorMessage);
    }
  } catch (error) {
    const status = statusCode(error);
    const errorMessage = `Cannot read CT project: ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(status, errorMessage);
  }
}
