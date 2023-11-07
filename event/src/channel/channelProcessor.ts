import { isErrorItem, logger } from 'shared';
import { Message } from '@commercetools/platform-sdk';

import { ChannelService } from '../services/channelService';

export class ChannelProcessor {
  constructor(private readonly channelService: ChannelService) {}

  async processChannel(message: Message & { notificationType?: string }): Promise<void> {
    if (message.resource?.typeId != 'channel') {
      logger.error(`Could not process CT message - resource.typeId '${message.resource?.typeId}' != 'channel'`);
      return;
    }

    const notificationType = message['notificationType'] as string;

    logger.info(
      `Processing '${notificationType}' message for '${message.resource.typeId}' '${message.resource.id}' '${message.resourceUserProvidedIdentifiers?.key}'`
    );

    try {
      if (notificationType === 'ResourceDeleted') {
        const tenantFacilityId = message.resourceUserProvidedIdentifiers?.key;
        if (tenantFacilityId) {
          const facilityId = await this.channelService.setFacilityOffline(tenantFacilityId);
          if (facilityId) {
            logger.info(`Set FFT Facility '${facilityId}' to OFFLINE for CT Channel '${tenantFacilityId}'`);
          }
        } else {
          logger.error(
            `Could not process CT message - ResourceDeleted: message.resourceUserProvidedIdentifiers.key required`
          );
        }
      } else if (notificationType === 'ResourceCreated' || notificationType === 'ResourceUpdated') {
        const channelId = message.resource.id;
        if (channelId) {
          const facility = await this.channelService.upsertFacility(channelId);
          if (facility) {
            logger.info(`Updated FFT Facility '${facility.id}' for CT Channel '${facility.tenantFacilityId}'`);
          }
        } else {
          logger.error(`Could not process CT message - ${notificationType}: resource.id required`);
        }
      } else {
        logger.error(`Could not process CT message - cannot handle notificationType '${notificationType}'`);
      }
    } catch (err) {
      let statusCode: string | number = 500;
      let errorMessage = 'Internal server error';
      if (isErrorItem(err)) {
        statusCode = err.statusCode;
        errorMessage = err.message;
      }
      logger.error(
        `Could not process CT '${notificationType}' message for '${message.resource.typeId}' '${message.resource.id}' '${message.resourceUserProvidedIdentifiers?.key}': ${statusCode} - ${errorMessage}`,
        err
      );
    }
  }
}
