import { isErrorItem, logger } from 'shared';
import { ChannelService } from '../services/channelService';
import { EventMessage } from '../controllers/eventController';

export class ChannelProcessor {
  constructor(private readonly channelService: ChannelService) {}

  async processChannel(message: EventMessage): Promise<void> {
    if (message.resource?.typeId != 'channel') {
      logger.warn(`Could not process CT message - resource.typeId '${message.resource?.typeId}' != 'channel'`);
      return;
    }

    logger.info(
      `Processing '${message.notificationType}' message for '${message.resource.typeId}' '${message.resource.id}' '${message.resourceUserProvidedIdentifiers?.key}'`
    );

    try {
      switch (message.notificationType) {
        case 'ResourceDeleted':
          await this.processChannelDeleted(message);
          break;
        case 'ResourceCreated':
        case 'ResourceUpdated':
          await this.processChannelUpdated(message);
          break;
        default:
          logger.warn(`Could not process CT message - cannot handle notificationType '${message.notificationType}'`);
          break;
      }
    } catch (err) {
      let statusCode: string | number = 500;
      let errorMessage = 'Internal server error';
      if (isErrorItem(err)) {
        statusCode = err.statusCode;
        errorMessage = err.message;
      }
      logger.error(
        `Could not process CT '${message.notificationType}' message for '${message.resource.typeId}' '${message.resource.id}' '${message.resourceUserProvidedIdentifiers?.key}': ${statusCode} - ${errorMessage}`,
        err
      );
    }
  }

  private async processChannelDeleted(message: EventMessage): Promise<void> {
    const tenantFacilityId = message.resourceUserProvidedIdentifiers?.key;
    if (tenantFacilityId) {
      const facilityId = await this.channelService.setFacilityOffline(tenantFacilityId);
      if (facilityId) {
        logger.info(`Set FFT Facility '${facilityId}' to OFFLINE for CT Channel '${tenantFacilityId}'`);
      }
    } else {
      logger.warn(`Could not process CT message '${message.id}': message.resourceUserProvidedIdentifiers.key required`);
    }
  }

  private async processChannelUpdated(message: EventMessage): Promise<void> {
    const channelId = message.resource.id;
    if (channelId) {
      const facility = await this.channelService.upsertFacility(channelId);
      if (facility) {
        logger.info(`Updated FFT Facility '${facility.id}' for CT Channel '${facility.tenantFacilityId}'`);
      }
    } else {
      logger.warn(`Could not process CT message '${message.id}': resource.id required`);
    }
  }
}
