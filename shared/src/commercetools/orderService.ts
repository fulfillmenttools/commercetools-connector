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
      const errorMessage = `Cannot read CT order ${commercetoolsId}: ${JSON.stringify(response)}`;
      logger.error(errorMessage);
      throw new CustomError(response.statusCode || 500, errorMessage);
    }
  } catch (error) {
    const errorMessage = `Cannot read CT order ${commercetoolsId}: ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(statusCode(error), errorMessage);
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
      const errorMessage = `Cannot update CT order ${commercetoolsId}: ${JSON.stringify(response)}`;
      logger.error(errorMessage);
      throw new CustomError(response.statusCode || 500, errorMessage);
    }
  } catch (error) {
    const errorMessage = `Cannot update CT order ${commercetoolsId}: ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(statusCode(error), errorMessage);
  }
}

export function getCustomTypeOfOrder(order: Order): string | undefined {
  return order.custom?.type?.obj?.key;
}
