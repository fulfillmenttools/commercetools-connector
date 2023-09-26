import { Order as CommercetoolsOrder } from '@commercetools/platform-sdk';
import {
  ArticleAttributeItem,
  ConsumerAddress,
  DeliveryPreferences,
  FftFacilityService,
  OrderForCreation as FulfillmenttoolsOrder,
  OrderArticleAttributeItem,
  OrderForCreationConsumer,
  OrderLineItemForCreation,
  PreselectedFacility,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import ArticleAttributeItemCategory = ArticleAttributeItem.CategoryEnum;
import { AmbiguousChannelError, Configuration, logger, ServiceType } from 'shared';
import { getConfiguration } from 'shared';
import { StoreService } from 'shared';

export class OrderMapper {
  constructor(private readonly ctStoreService: StoreService, private readonly facilityService: FftFacilityService) {}

  public async mapOrder(commercetoolsOrder: CommercetoolsOrder): Promise<FulfillmenttoolsOrder> {
    return {
      tenantOrderId: commercetoolsOrder.orderNumber || commercetoolsOrder.id,
      consumer: this.mapConsumer(commercetoolsOrder),
      orderDate: new Date(commercetoolsOrder.createdAt),
      orderLineItems: this.mapOrderLineItems(commercetoolsOrder),
      customAttributes: {
        commercetoolsId: commercetoolsOrder.id,
      },
      deliveryPreferences: await this.mapDeliveryPreferences(commercetoolsOrder),
    };
  }

  private async getPreselectedFacilities(commercetoolsOrder: CommercetoolsOrder): Promise<PreselectedFacility[]> {
    if (commercetoolsOrder.store) {
      const store = await this.ctStoreService.getByKeyWithChannels(commercetoolsOrder.store?.key);
      return await Promise.all(
        store.supplyChannels.map(async (channel) => {
          const strippedFacility = await this.facilityService.getStrippedFacility(channel.obj.key);
          return {
            facilityRef: strippedFacility.id,
          };
        })
      );
    }
    return [];
  }

  private async getFacilityIdForLineItemChannel(commercetoolsOrder: CommercetoolsOrder): Promise<string> {
    const distinctChannels = new Set<string>();
    commercetoolsOrder.lineItems.forEach((lineItem) => {
      if (lineItem.supplyChannel?.obj?.key) {
        distinctChannels.add(lineItem.supplyChannel?.obj?.key);
      }
    });
    if (distinctChannels.size !== 1) {
      const errorMessage = `CT order '${commercetoolsOrder.id}' contains lineItems with 0 or more than 1 supplyChannel. No channel will be mapped!`;
      logger.error(errorMessage);
      throw new AmbiguousChannelError(errorMessage);
    }
    const channelKey = distinctChannels.values().next().value;
    const strippedFacility = await this.facilityService.getStrippedFacility(channelKey);
    return strippedFacility.id;
  }

  private async mapDeliveryPreferences(commercetoolsOrder: CommercetoolsOrder): Promise<DeliveryPreferences> {
    const shippingMethodKey = commercetoolsOrder.shippingInfo?.shippingMethod?.obj?.key;
    const configuration = await getConfiguration();
    if (!shippingMethodKey || !configuration || !configuration.shippingMethodMapping?.[shippingMethodKey]) {
      return {
        shipping: {
          preselectedFacilities: await this.getPreselectedFacilities(commercetoolsOrder),
        },
      };
    }
    const deliveryConfig = configuration.shippingMethodMapping[shippingMethodKey];

    if (deliveryConfig?.serviceType === ServiceType.SHIPPING) {
      return {
        shipping: {
          preselectedFacilities: await this.getPreselectedFacilities(commercetoolsOrder),
          preferredCarriers: deliveryConfig.carriers,
          serviceLevel: deliveryConfig.serviceLevel,
        },
      };
    } else if (deliveryConfig?.serviceType === ServiceType.CLICK_AND_COLLECT) {
      const supplyChannelKey = this.getSupplyChannelFromCustomField(commercetoolsOrder, configuration);
      if (supplyChannelKey) {
        const facility = await this.facilityService.getStrippedFacility(supplyChannelKey);
        return { collect: [{ facilityRef: facility.id }] };
      }
      return {
        collect: [{ facilityRef: await this.getFacilityIdForLineItemChannel(commercetoolsOrder) }],
      };
    }
    return {
      shipping: {
        preselectedFacilities: await this.getPreselectedFacilities(commercetoolsOrder),
      },
    };
  }

  private mapOrderLineItems(commercetoolsOrder: CommercetoolsOrder): OrderLineItemForCreation[] {
    function getStringValue(value: { [key: string]: any }): string {
      const locales = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en', 'de-DE', 'de-AT', 'de-CH', 'de'];
      let result: string | undefined = undefined;
      for (const locale of locales) {
        if (Object.prototype.hasOwnProperty.call(value, locale)) {
          result = String(value[locale]);
          break;
        }
      }
      if (!result && Object.prototype.hasOwnProperty.call(value, 'label')) {
        result = mapAttributeValue(value['label']);
      }
      return result || ' ';
    }

    function mapAttributeValue(value: any): string {
      if (value === undefined || value === null) {
        return ' '; // FFT API does not allow empty attribute value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
      } else if (typeof value === 'object') {
        return getStringValue(value as object);
      } else {
        return ' '; // FFT API does not allow empty attribute value;
      }
    }

    return commercetoolsOrder.lineItems.map((lineItem) => {
      const orderLineItemForCreation: OrderLineItemForCreation = {
        article: {
          tenantArticleId: lineItem.variant?.sku || lineItem.productId,
          title: mapAttributeValue(lineItem.name),
          imageUrl: lineItem.variant?.images?.[0]?.url,
          attributes: lineItem.variant?.attributes
            ?.filter((item) => item.name != 'scannableCodes')
            .map(
              (attr) =>
                ({
                  key: attr.name,
                  value: mapAttributeValue(attr.value),
                  category: ArticleAttributeItemCategory.Miscellaneous,
                } as OrderArticleAttributeItem)
            )
            .filter((attr) => attr.value.trim().length > 0),
        },
        quantity: lineItem.quantity,
        shopPrice: lineItem.price?.value?.centAmount / 100,
        customAttributes: {
          commercetoolsId: lineItem.id,
        },
      };
      return orderLineItemForCreation;
    });
  }

  private mapConsumer(commercetoolsOrder: CommercetoolsOrder): OrderForCreationConsumer {
    return {
      addresses: [this.mapConsumerAddress(commercetoolsOrder)],
      email: commercetoolsOrder.customerEmail,
    };
  }

  private mapConsumerAddress(commercetoolsOrder: CommercetoolsOrder): ConsumerAddress {
    return {
      firstName: commercetoolsOrder.shippingAddress?.firstName || '',
      lastName: commercetoolsOrder.shippingAddress?.lastName || '',
      city: commercetoolsOrder.shippingAddress?.city || '',
      country: commercetoolsOrder.shippingAddress?.country || '',
      houseNumber: commercetoolsOrder.shippingAddress?.streetNumber || '',
      postalCode: commercetoolsOrder.shippingAddress?.postalCode || '',
      street: commercetoolsOrder.shippingAddress?.streetName || '',
      additionalAddressInfo: commercetoolsOrder.shippingAddress?.additionalAddressInfo,
      companyName: commercetoolsOrder.shippingAddress?.company,
    };
  }

  private getSupplyChannelFromCustomField(order: CommercetoolsOrder, config: Configuration): string | undefined {
    const supplyChannelReferenceFieldName = config.collectChannelReferenceFieldName;
    if (!supplyChannelReferenceFieldName) {
      return undefined;
    }
    return order.custom?.fields[supplyChannelReferenceFieldName];
  }
}
