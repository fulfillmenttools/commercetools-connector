import { Channel } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client';
import { CustomError } from '../errors';
import { logger } from '../utils';
import { statusCode } from './statusCode';

export async function getChannelById(channelId: string): Promise<Channel | undefined> {
  try {
    const result = await createApiRoot().channels().withId({ ID: channelId }).get().execute();

    if (result.statusCode === 200) {
      return result.body;
    } else {
      const errorMessage = `Cannot read CT channel ${channelId}: ${JSON.stringify(result)}`;
      logger.error(errorMessage);
      throw new CustomError(result.statusCode || 500, errorMessage);
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.warn(`CT channel ${channelId} not found`);
      return undefined;
    }
    const errorMessage = `Cannot read CT channel ${channelId}: ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(status, errorMessage);
  }
}
