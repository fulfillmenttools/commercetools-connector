import { NextFunction, Request, Response } from 'express';
import { Message, OrderCreatedMessage, OrderStateChangedMessage, Reference } from '@commercetools/platform-sdk';

import { logger, CustomError, SubscriptionMessage } from 'shared';
import { OrderProcessor } from '../order/orderProcessor';
import { ChannelProcessor } from '../channel/channelProcessor';

export class EventController {
  constructor(private readonly orderProcessor: OrderProcessor, private readonly channelProcessor: ChannelProcessor) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async post(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const message = this.validateMessage(request);
    await this.processMessage(message);
    response.status(201).send();
  }

  private async processMessage(message: Message) {
    const resourceRef = message.resource;
    const typeString = resourceRef.typeId as string;
    switch (resourceRef.typeId) {
      case 'order':
        if (this.isOrderStateConfirmedMessage(message) || this.isOrderCreatedWithStateConfirmedMessage(message)) {
          await this.orderProcessor.processOrder(resourceRef.id, message.resourceUserProvidedIdentifiers?.orderNumber);
        } else if (this.isOrderStateCancelledMessage(message) || this.isOrderDeletedMessage(message)) {
          await this.orderProcessor.cancelOrder(resourceRef.id, message.resourceUserProvidedIdentifiers?.orderNumber);
        }
        break;
      case 'channel':
        if (this.isChannelMessage(message)) {
          await this.channelProcessor.processChannel(message);
        }
        break;
      default:
        // commercetools sends this message when a subscription is created/updated
        if (typeString === 'subscription') {
          break;
        }
        throw new CustomError(
          400,
          `Bad request: Resource type ${resourceRef.typeId} of message ${message.id} is not supported!`
        );
    }
  }

  private validateMessage(request: Request): SubscriptionMessage {
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

    let message: SubscriptionMessage;
    try {
      message = JSON.parse(decodedData) as SubscriptionMessage;
    } catch (e) {
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
    if (!message.notificationType || message.notificationType === '') {
      throw new CustomError(400, `Bad request: Message ${message.id} does not contain valid notification type`);
    }

    // TODO validate message.projectKey === CTP_PROJECT_KEY

    return message;
  }

  private isOrderStateConfirmedMessage(message: Message): boolean {
    if (message.type === 'OrderStateChanged') {
      return (message as OrderStateChangedMessage).orderState === 'Confirmed';
    }
    return false;
  }

  private isOrderCreatedWithStateConfirmedMessage(message: Message): boolean {
    if (message.type === 'OrderCreated') {
      return (message as OrderCreatedMessage).order.orderState === 'Confirmed';
    }
    return false;
  }

  private isOrderStateCancelledMessage(message: Message): boolean {
    if (message.type === 'OrderStateChanged') {
      return (message as OrderStateChangedMessage).orderState === 'Cancelled';
    }
    return false;
  }

  private isOrderDeletedMessage(message: Message): boolean {
    return message.type === 'OrderDeleted';
  }

  private isChannelMessage(message: Message & { notificationType?: string }): boolean {
    const notificationType = message['notificationType'];
    return (
      notificationType === 'ResourceUpdated' ||
      notificationType === 'ResourceCreated' ||
      notificationType === 'ResourceDeleted'
    );
  }
}
