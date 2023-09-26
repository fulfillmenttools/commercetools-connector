import { Order, OrderUpdate } from '@commercetools/platform-sdk';

import { createApiRoot } from '../client';
import { CustomError } from '../errors';
import { logger } from '../utils';
import { statusCode } from './statusCode';

export async function getCommercetoolsOrderById(commercetoolsId: string): Promise<Order> {
  try {
    const response = await createApiRoot()
      .orders()
      .withId({ ID: commercetoolsId })
      .get({
        queryArgs: {
          expand: ['shippingInfo.shippingMethod', 'lineItems[*].supplyChannel', 'custom.type'],
        },
      })
      .execute();
    if (response.statusCode === 200) {
      return response.body;
    } else {
      throw new CustomError(response.statusCode || 500, `Cannot read CT order ${commercetoolsId}`);
    }
  } catch (error) {
    throw new CustomError(statusCode(error), `Cannot read CT order ${commercetoolsId}`);
  }
}

export async function updateCommercetoolsOrder(commercetoolsId: string, orderUpdate: OrderUpdate): Promise<Order> {
  try {
    const response = await createApiRoot()
      .orders()
      .withId({ ID: commercetoolsId })
      .post({
        body: orderUpdate,
      })
      .execute();

    if (response.statusCode === 200) {
      logger.debug(`CT Order '${commercetoolsId}' updated successfully`, orderUpdate);
      return response.body;
    } else {
      throw new CustomError(response.statusCode || 500, `Cannot update CT order ${commercetoolsId}`);
    }
  } catch (error) {
    throw new CustomError(statusCode(error), `Cannot update CT order ${commercetoolsId}`);
  }
}

export function getCustomTypeOfOrder(order: Order): string | undefined {
  return order.custom?.type?.obj?.key;
}
