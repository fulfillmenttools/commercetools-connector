import {
  HandoverJobCreatedWebHookEvent,
  HandoverJobHandedOverWebHookEvent,
  OrderCreatedWebHookEvent,
  PickjobCreatedWebHookEvent,
  PickjobPickingFinishedWebHookEvent,
  WebHookEvent,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { CustomError, logger } from 'shared';

function invalidEvent(event: ValidatedWebHookEvent, type: string): boolean {
  return !event || typeof event !== 'object' || !event.payload || event.event !== type;
}

export function assertOrderCreatedEvent(
  orderCreatedEvent: OrderCreatedWebHookEvent
): asserts orderCreatedEvent is ValidatedOrderEvent {
  if (invalidEvent(orderCreatedEvent, 'ORDER_CREATED')) {
    logger.warn('Invalid event message received');
    throw new CustomError(400, `Bad Request - Invalid event message received`);
  }
}

export function assertPickJobCreatedEvent(
  pickJobCreatedEvent: PickjobCreatedWebHookEvent
): asserts pickJobCreatedEvent is ValidatedPickJobCreatedEvent {
  if (invalidEvent(pickJobCreatedEvent, 'PICK_JOB_CREATED')) {
    logger.warn('Invalid event message received');
    throw new CustomError(400, `Bad Request - Invalid event message received`);
  }
}

export function assertPickJobFinishedEvent(
  pickJobFinishedEvent: PickjobPickingFinishedWebHookEvent
): asserts pickJobFinishedEvent is ValidatedPickJobFinishedEvent {
  if (invalidEvent(pickJobFinishedEvent, 'PICK_JOB_PICKING_FINISHED')) {
    logger.warn('Invalid event message received');
    throw new CustomError(400, `Bad Request - Invalid event message received`);
  }
}

export function assertHandoverJobCreatedEvent(
  handoverJobCreatedEvent: HandoverJobCreatedWebHookEvent
): asserts handoverJobCreatedEvent is ValidatedHandoverJobCreatedWebHookEvent {
  if (invalidEvent(handoverJobCreatedEvent, 'HANDOVERJOB_CREATED')) {
    logger.warn('Invalid event message received');
    throw new CustomError(400, `Bad Request - Invalid event message received`);
  }
}

export function assertHandoverJobHandedOver(
  handoverJobHandedOverEvent: HandoverJobHandedOverWebHookEvent
): asserts handoverJobHandedOverEvent is ValidatedHandoverJobHandedOverWebHookEvent {
  if (invalidEvent(handoverJobHandedOverEvent, 'HANDOVERJOB_HANDED_OVER')) {
    logger.warn('Invalid event message received');
    throw new CustomError(400, `Bad Request - Invalid event message received`);
  }
}

type ValidatedWebHookEvent = WebHookEvent & { payload: unknown };

type ValidatedOrderEvent = OrderCreatedWebHookEvent;
type ValidatedPickJobCreatedEvent = PickjobCreatedWebHookEvent;
type ValidatedPickJobFinishedEvent = PickjobPickingFinishedWebHookEvent;
type ValidatedHandoverJobCreatedWebHookEvent = HandoverJobCreatedWebHookEvent;
type ValidatedHandoverJobHandedOverWebHookEvent = HandoverJobHandedOverWebHookEvent;
