import { Address, Channel, Project } from '@commercetools/platform-sdk';
import {
  AddressPhoneNumbers,
  Facility,
  FacilityAddressForCreation,
  FacilityForCreation,
  FacilityServiceType,
  FacilityStatus,
  FftFacilityService,
  ModifyFacilityAction,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { getChannelById, getProject, logger } from 'shared';

export class ChannelService {
  constructor(private readonly fftFacilityService: FftFacilityService) {}

  public async processChannel(channelId: string): Promise<Facility | undefined> {
    const channel = await getChannelById(channelId);

    if (!channel) {
      logger.error(`Could not read CT Channel '${channelId}'`);
      return;
    }

    if (channel.roles.includes('InventorySupply')) {
      const fftFacilityId = await this.fftFacilityService.getFacilityId(channel.key, true);
      const project = await getProject();

      if (fftFacilityId !== undefined) {
        logger.info(`Updating FFT Facility '${fftFacilityId}' from CT Channel '${channel.key}'`);
        const facilityForUpdate = this.mapChannelToFacilityUpdate(channel, project);

        return await this.fftFacilityService.updateFacility(fftFacilityId, facilityForUpdate);
      } else {
        logger.info(`Creating new FFT Facility from CT Channel '${channel.key}'`);
        const facilityForCreation = this.mapChannelToFacility(channel, project);

        return await this.fftFacilityService.createFacility(facilityForCreation);
      }
    } else {
      logger.info(`Nothing to do for CT Channel '${channel.key}' because it does not have 'InventorySupply' role`);
      return undefined;
    }
  }

  public async deleteChannel(tenantFacilityId: string): Promise<string | undefined> {
    return await this.fftFacilityService.deleteFacility(tenantFacilityId, false);
  }

  private mapChannelToFacility(channel: Channel, project: Project): FacilityForCreation {
    return {
      name: this.mapName(channel, project.languages),
      // TODO make location type configurable, e.g. read from channel custom attribute
      locationType: FacilityForCreation.LocationTypeEnum.STORE,
      tenantFacilityId: channel.key,
      status: FacilityStatus.ONLINE,
      address: this.mapAddress(channel.address, project.name, project.countries),
      // TODO make services configurable, e.g. read from channel custom attribute
      services: [
        {
          type: FacilityServiceType.SHIPFROMSTORE,
        },
        {
          type: FacilityServiceType.PICKUP,
        },
      ],
      customAttributes: {
        commercetoolsId: channel.id,
      },
    };
  }

  private mapChannelToFacilityUpdate(channel: Channel, project: Project): ModifyFacilityAction {
    return {
      action: ModifyFacilityAction.ActionEnum.ModifyFacility,
      name: this.mapName(channel, project.languages),
      tenantFacilityId: channel.key,
      address: this.mapAddress(channel.address, project.name, project.countries),
    };
  }

  private mapName(channel: Channel, languages: string[]): string {
    if (channel.name) {
      for (const language of languages) {
        if (Object.prototype.hasOwnProperty.call(channel.name, language)) {
          return String(channel.name[language]?.trim());
        }
      }
    }
    return channel.key;
  }

  private mapAddress(
    address: Address | undefined,
    defaultName: string,
    countries: string[]
  ): FacilityAddressForCreation {
    const defaultCountry = countries && countries.length > 0 ? countries[0] : 'DE';
    if (address) {
      return {
        street: address.streetName?.trim() || 'not set',
        houseNumber: address.streetNumber?.trim() || '0',
        postalCode: address.postalCode?.replace(/\s/g, '') || '00000',
        city: address.city?.trim() || 'not set',
        province: address.state?.trim() || '',
        country: address.country?.trim() || defaultCountry,
        companyName: defaultName,
        phoneNumbers: [
          {
            type: AddressPhoneNumbers.TypeEnum.PHONE,
            value: '',
            label: '',
          },
        ],
      };
    } else {
      return {
        street: 'not set',
        houseNumber: '0',
        postalCode: '00000',
        city: 'not set',
        country: defaultCountry,
        companyName: defaultName,
        phoneNumbers: [
          {
            type: AddressPhoneNumbers.TypeEnum.PHONE,
            value: '',
            label: '',
          },
        ],
      };
    }
  }
}
