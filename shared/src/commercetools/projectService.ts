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
      throw new CustomError(result.statusCode || 500, `Cannot read CT project`);
    }
  } catch (error) {
    const status = statusCode(error);
    logger.error(JSON.stringify(error));
    throw new CustomError(status, `Cannot read CT project`);
  }
}
