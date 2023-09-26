import { Order as CommercetoolsOrder, OrderUpdateAction } from '@commercetools/platform-sdk';
import { Order } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

import { FFTConstants, logger } from 'shared';
import { getCommercetoolsOrderById, getCustomTypeOfOrder, updateCommercetoolsOrder } from 'shared';
import { createCustomOrderType, getCustomOrderType, orderCustomTypeKey, updateCustomOrderType } from 'shared';
import { setCustomFieldAction, setCustomTypeAction, updateOrderAction } from 'shared';

export class OrderService {
  public async orderCreated(order: Order): Promise<void> {
    logger.info(`FFT Order created '${order.id}'`);

    const commercetoolsOrderId: string | undefined = order.customAttributes?.commercetoolsId;
    if (!commercetoolsOrderId) {
      logger.info(`Ignoring FFT order '${order.id}' because it does not correspond to a CT order`);
      return;
    }

    const commercetoolsOrder = await getCommercetoolsOrderById(commercetoolsOrderId);

    let customOrderTypeId = await getCustomOrderType();
    if (customOrderTypeId === undefined) {
      customOrderTypeId = await createCustomOrderType();
    } else {
      await updateCustomOrderType(customOrderTypeId);
    }

    const actions = await updateCustomField(commercetoolsOrder, order.id);

    if (actions.length > 0) {
      const updateAction = updateOrderAction(commercetoolsOrder, actions);
      await updateCommercetoolsOrder(commercetoolsOrder.id, updateAction);

      logger.info(`Updated CT order '${commercetoolsOrder.id}' with FFT order id '${order.id}'`);
    }
  }
}

async function updateCustomField(
  commercetoolsOrder: CommercetoolsOrder,
  orderId: string
): Promise<OrderUpdateAction[]> {
  const actions: OrderUpdateAction[] = [];
  // check custom type
  const orderCustomType = getCustomTypeOfOrder(commercetoolsOrder);
  const customTypeKey = await orderCustomTypeKey();
  if (customTypeKey) {
    if (orderCustomType === undefined) {
      logger.info(
        `Update CT order '${commercetoolsOrder.id}' to custom type '${customTypeKey}' and set field '${FFTConstants.ORDER_ID}'`
      );
      // set custom type && custom fields
      actions.push(
        setCustomTypeAction(customTypeKey, [
          {
            name: FFTConstants.ORDER_ID,
            value: orderId,
          },
        ])
      );
    } else if (orderCustomType === customTypeKey) {
      // set custom fields
      logger.info(`Update CT order '${commercetoolsOrder.id}' set field '${FFTConstants.ORDER_ID}'`);
      actions.push(setCustomFieldAction(FFTConstants.ORDER_ID, orderId));
    } else {
      logger.warn(
        `CT order '${commercetoolsOrder.id}' has unsupported custom type '${orderCustomType}' and will not be updated`
      );
    }
  } else {
    logger.warn(
      `No order custom type defined in configuration, CT order '${commercetoolsOrder.id}' will not be updated`
    );
  }
  return actions;
}
