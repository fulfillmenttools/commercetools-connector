import {
  Message,
  OrderCreatedMessage,
  OrderDeletedMessage,
  OrderStateChangedMessage,
  Reference,
  ResourceCreatedDeliveryPayload,
  ResourceDeletedDeliveryPayload,
  ResourceUpdatedDeliveryPayload,
  DeliveryPayload,
} from '@commercetools/platform-sdk';
import { NextFunction, Request, Response } from 'express';

import { CustomError, logger, readConfiguration } from 'shared';
import { ChannelProcessor } from '../channel/channelProcessor';
import { OrderProcessor } from '../order/orderProcessor';

export type EventMessage = DeliveryPayload & Message;

export class EventController {
  constructor(
    private readonly orderProcessor: OrderProcessor,
    private readonly channelProcessor: ChannelProcessor
  ) {
    this.post = this.post.bind(this);
  }

  /**
   * Exposed event POST endpoint.
   * Receives the Pub/Sub message and works with it
   *
   * @param {Request} request The express request
   * @param {Response} response The express response
   * @returns
   */
  public async post(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const message = this.validateMessage(request);
    await this.processMessage(message);
    response.status(201).send();
  }

  private async processMessage(message: EventMessage) {
    const config = readConfiguration();
    switch (message.resource.typeId) {
      case 'order':
        if (config.featOrdersyncActive.toLowerCase() === 'false') {
          // FeatureFlag: Disables the Order Sync from ct to fft
          logger.info('Order Sync deactivated');
          break;
        }
        if (this.isOrderStateConfirmedMessage(message) || this.isOrderCreatedWithStateConfirmedMessage(message)) {
          await this.orderProcessor.processOrder(
            message.resource.id,
            message.resourceUserProvidedIdentifiers?.orderNumber
          );
        } else if (this.isOrderStateCancelledMessage(message) || this.isOrderDeletedMessage(message)) {
          await this.orderProcessor.cancelOrder(
            message.resource.id,
            message.resourceUserProvidedIdentifiers?.orderNumber
          );
        }
        break;
      case 'channel':
        if (config.featChannelsyncActive.toLowerCase() === 'false') {
          // FeatureFlag: Disables the Channel Sync from ct to fft
          logger.info('Channel Sync deactivated');
          break;
        }
        if (this.isChannelMessage(message)) {
          await this.channelProcessor.processChannel(message);
        }
        break;
      default:
        // commercetools sends this message when a subscription is created/updated
        // ignored because missing in ts mapping but https://docs.commercetools.com/api/types#referencetypeid
        // @ts-ignore
        if (message.resource.typeId === 'subscription') {
          break;
        }
        throw new CustomError(
          400,
          `Bad request: Resource type ${message.resource.typeId} of message ${message.id} is not supported!`
        );
    }
  }

  private validateMessage(request: Request): EventMessage {
    // Check request body
    if (!request.body) {
      logger.error('Missing request body.');
      throw new CustomError(400, 'Bad request: No Pub/Sub message was received');
    }
    // Check if the body comes in a message
    if (!request.body.message || typeof request.body.message.data !== 'string') {
      logger.error('Missing body message');
      throw new CustomError(400, 'Bad request: Wrong Pub/Sub message format');
    }
    const pubSubMessage = request.body.message;
    if (!pubSubMessage.data) {
      logger.error('Missing body message data');
      throw new CustomError(400, 'Bad request: Wrong Pub/Sub message format');
    }

    const decodedData = Buffer.from(pubSubMessage.data, 'base64').toString().trim();

    let message: EventMessage;
    try {
      message = JSON.parse(decodedData) as EventMessage;
    } catch (e) {
      logger.error('Cannot parse message data', e);
      throw new CustomError(400, `Bad request: Cannot parse message data`);
    }

    if (
      !message.resource ||
      message.resource === ({} as Reference) ||
      !message.resource.typeId ||
      !message.resource.id
    ) {
      throw new CustomError(400, `Bad request: Message ${message.id} does not contain valid resource reference`);
    }

    return message;
  }

  private isOrderStateConfirmedMessage(message: Message): message is OrderStateChangedMessage {
    return message.type === 'OrderStateChanged' && message.orderState === 'Confirmed';
  }

  private isOrderCreatedWithStateConfirmedMessage(message: Message): message is OrderCreatedMessage {
    return message.type === 'OrderCreated' && message.order.orderState === 'Confirmed';
  }

  private isOrderStateCancelledMessage(message: Message): message is OrderStateChangedMessage {
    return message.type === 'OrderStateChanged' && message.orderState === 'Cancelled';
  }

  private isOrderDeletedMessage(message: Message): message is OrderDeletedMessage {
    return message.type === 'OrderDeleted';
  }

  private isChannelMessage(
    message: EventMessage
  ): message is (ResourceCreatedDeliveryPayload | ResourceUpdatedDeliveryPayload | ResourceDeletedDeliveryPayload) &
    Message {
    return (
      'notificationType' in message &&
      (message.notificationType === 'ResourceUpdated' ||
        message.notificationType === 'ResourceCreated' ||
        message.notificationType === 'ResourceDeleted')
    );
  }
}
