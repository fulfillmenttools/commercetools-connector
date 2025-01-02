import { Store } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/createClient';
import { CustomError } from '../errors';
import { ExpandedStore } from '../types/expandedStore';

export class StoreService {
  public async query(): Promise<Store[]> {
    try {
      const response = await createApiRoot().stores().get().execute();
      return response.body.results;
    } catch (error) {
      throw new CustomError(400, `Bad request: ${error}`);
    }
  }
  public async getById(id: string): Promise<Store> {
    try {
      const response = await createApiRoot().stores().withId({ ID: id }).get().execute();
      return response.body;
    } catch (error) {
      throw new CustomError(400, `Bad request: ${error}`);
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
      throw new CustomError(400, `Bad request: ${error}`);
    }
  }
}
