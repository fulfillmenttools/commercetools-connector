import { Store } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/createClient';
import { CustomError } from '../errors';
import { ExpandedStore } from '../types/expandedStore';
import { logger } from '../utils/loggerUtils';

export class StoreService {
  public async query(): Promise<Store[]> {
    try {
      const response = await createApiRoot().stores().get().execute();
      return response.body.results;
    } catch (error) {
      const errorMessage = `Bad request: ${JSON.stringify(error)}`;
      logger.error(errorMessage);
      throw new CustomError(400, errorMessage);
    }
  }
  public async getById(id: string): Promise<Store> {
    try {
      const response = await createApiRoot().stores().withId({ ID: id }).get().execute();
      return response.body;
    } catch (error) {
      const errorMessage = `Bad request: ${JSON.stringify(error)}`;
      logger.error(errorMessage);
      throw new CustomError(400, errorMessage);
    }
  }
  public async getByKeyWithChannels(id: string): Promise<ExpandedStore> {
    try {
      const response = await createApiRoot()
        .stores()
        .withKey({ key: id })
        .get({ queryArgs: { expand: 'supplyChannels[*]' } })
        .execute();
      return response.body as unknown as ExpandedStore;
    } catch (error) {
      const errorMessage = `Bad request: ${JSON.stringify(error)}`;
      logger.error(errorMessage);
      throw new CustomError(400, errorMessage);
    }
  }
}
