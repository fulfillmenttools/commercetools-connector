import { Channel, ChannelRoleEnum } from '@commercetools/platform-sdk';
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
      throw new CustomError(result.statusCode || 500, `Cannot read CT channel ${channelId}`);
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.warn(`CT channel ${channelId} not found`);
      return undefined;
    }
    logger.error(JSON.stringify(error));
    throw new CustomError(status, `Cannot read CT channel ${channelId}`);
  }
}

export async function getChannelsWithRole(role: ChannelRoleEnum): Promise<Channel[]> {
  try {
    const result = await createApiRoot()
      .channels()
      .get({ queryArgs: { where: `roles contains any ("${role}")` } })
      .execute();

    if (result.statusCode === 200) {
      return result.body.results;
    } else {
      throw new CustomError(result.statusCode || 500, `Cannot read CT channels with role ${role}`);
    }
  } catch (error) {
    const status = statusCode(error);
    logger.error(JSON.stringify(error));
    throw new CustomError(status, `Cannot read CT channels with role ${role}`);
  }
}
