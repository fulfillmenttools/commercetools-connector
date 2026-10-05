import { Address, Order as CommercetoolsOrder } from '@commercetools/platform-sdk';
import {
  AddressPhoneNumbers,
  AddressType,
  ArticleAttributeItem,
  ConsumerAddress,
  DeliveryPreferences,
  FftFacilityService,
  OrderForCreation as FulfillmenttoolsOrder,
  OrderArticleAttributeItem,
  OrderForCreationConsumer,
  OrderLineItemForCreation,
  PreselectedFacility,
  TagReference,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import {
  AmbiguousChannelError,
  Configuration,
  EmptyOrderError,
  ServiceType,
  StoreService,
  getConfiguration,
  logger,
} from 'shared';
import ArticleAttributeItemCategory = ArticleAttributeItem.CategoryEnum;

function isValidString(input: unknown): boolean {
  return typeof input === 'string' && input.trim().length > 0;
}

export class OrderMapper {
  constructor(
    private readonly ctStoreService: StoreService,
    private readonly facilityService: FftFacilityService
  ) {}

  public async mapOrder(commercetoolsOrder: CommercetoolsOrder): Promise<FulfillmenttoolsOrder> {
    const configuration = await getConfiguration();
    const orderLineItems = this.mapOrderLineItems(commercetoolsOrder);
    if (orderLineItems.length === 0) {
      // fulfillmenttools rejects such an order with a bare 400 ("Please provide
      // at least one orderLineItem or custom service.") that names neither the
      // order nor the reason. Fail here instead, and say which case it is.
      const customLineItemCount = commercetoolsOrder.customLineItems?.length ?? 0;
      const cause =
        customLineItemCount > 0
          ? `it carries its ${customLineItemCount} item(s) as customLineItems, which this connector does not map`
          : 'it has neither lineItems nor customLineItems';
      throw new EmptyOrderError(
        `CT order '${commercetoolsOrder.id}' cannot be synced to fulfillmenttools: ${cause}. ` +
          `A fulfillmenttools order needs at least one orderLineItem.`
      );
    }
    const order: FulfillmenttoolsOrder = {
      tenantOrderId: commercetoolsOrder.orderNumber || commercetoolsOrder.id,
      consumer: this.mapConsumer(commercetoolsOrder),
      orderDate: new Date(commercetoolsOrder.createdAt),
      orderLineItems,
      customAttributes: {
        commercetoolsId: commercetoolsOrder.id,
      },
      deliveryPreferences: await this.mapDeliveryPreferences(commercetoolsOrder, configuration),
      paymentInfo: {
        currency: commercetoolsOrder.totalPrice.currencyCode,
      },
    };
    const tags = this.mapTags(commercetoolsOrder, configuration);
    if (tags && tags.length > 0) {
      order.tags = tags;
    }
    return order;
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
    const channelKey = distinctChannels.values().next().value as string;
    const strippedFacility = await this.facilityService.getStrippedFacility(channelKey);
    return strippedFacility.id;
  }

  private async mapDeliveryPreferences(
    commercetoolsOrder: CommercetoolsOrder,
    configuration?: Configuration
  ): Promise<DeliveryPreferences> {
    const shippingMethodKey = commercetoolsOrder.shippingInfo?.shippingMethod?.obj?.key;
    if (!shippingMethodKey || !configuration?.shippingMethodMapping?.[shippingMethodKey]) {
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
      const paid = commercetoolsOrder.paymentState === 'Paid';
      const supplyChannelKey = this.getSupplyChannelFromCustomField(commercetoolsOrder, configuration);
      if (supplyChannelKey) {
        const facility = await this.facilityService.getStrippedFacility(supplyChannelKey);
        return { collect: [{ facilityRef: facility.id, paid }] };
      }
      return {
        collect: [{ facilityRef: await this.getFacilityIdForLineItemChannel(commercetoolsOrder), paid }],
      };
    }
    return {
      shipping: {
        preselectedFacilities: await this.getPreselectedFacilities(commercetoolsOrder),
      },
    };
  }

  private mapOrderLineItems(commercetoolsOrder: CommercetoolsOrder): OrderLineItemForCreation[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                }) as OrderArticleAttributeItem
            )
            .filter((attr) => attr.value.trim().length > 0),
        },
        quantity: lineItem.quantity,
        shopPrice: lineItem.price?.value?.centAmount / 10 ** lineItem.price?.value?.fractionDigits,
        customAttributes: {
          commercetoolsId: lineItem.id,
        },
      };
      return orderLineItemForCreation;
    });
  }

  private mapConsumer(commercetoolsOrder: CommercetoolsOrder): OrderForCreationConsumer {
    const addresses: ConsumerAddress[] = [];
    if (commercetoolsOrder.shippingAddress) {
      addresses.push(this.mapShippingAddress(commercetoolsOrder.shippingAddress));
    }
    if (commercetoolsOrder.billingAddress) {
      addresses.push(this.mapBillingAddress(commercetoolsOrder.billingAddress));
    }
    return {
      addresses,
      email: commercetoolsOrder.customerEmail,
    };
  }

  private mapShippingAddress(commercetoolsAddress: Address): ConsumerAddress {
    const address = this.mapAddress(commercetoolsAddress);
    address.addressType = AddressType.POSTALADDRESS;
    return address;
  }

  private mapBillingAddress(commercetoolsAddress: Address): ConsumerAddress {
    const address = this.mapAddress(commercetoolsAddress);
    address.addressType = AddressType.INVOICEADDRESS;
    return address;
  }

  private mapAddress(commercetoolsAddress: Address): ConsumerAddress {
    const address: ConsumerAddress = {
      salutation: commercetoolsAddress.salutation || '',
      firstName: commercetoolsAddress.firstName || '',
      lastName: commercetoolsAddress.lastName || '',
      street: commercetoolsAddress.streetName || '', // mandatory for fft, but ct type says it's not
      houseNumber: commercetoolsAddress.streetNumber || '',
      additionalAddressInfo: commercetoolsAddress.additionalAddressInfo || '',
      postalCode: commercetoolsAddress.postalCode || '',
      city: commercetoolsAddress.city || '',
      country: commercetoolsAddress.country || '',
      companyName: commercetoolsAddress.company || '',
    };
    if (isValidString(commercetoolsAddress.email)) {
      address.email = commercetoolsAddress.email;
    }
    if (isValidString(commercetoolsAddress.state)) {
      address.province = commercetoolsAddress.state;
    }
    const phoneNumbers: AddressPhoneNumbers[] = [];
    if (commercetoolsAddress.mobile) {
      phoneNumbers.push({
        value: commercetoolsAddress.mobile,
        type: AddressPhoneNumbers.TypeEnum.MOBILE,
      });
    }
    if (commercetoolsAddress.phone) {
      phoneNumbers.push({
        value: commercetoolsAddress.phone,
        type: AddressPhoneNumbers.TypeEnum.PHONE,
      });
    }
    if (phoneNumbers.length > 0) {
      address.phoneNumbers = phoneNumbers;
    }
    return address;
  }

  private getSupplyChannelFromCustomField(order: CommercetoolsOrder, config: Configuration): string | undefined {
    const supplyChannelReferenceFieldName = config.collectChannelReferenceFieldName;
    if (!supplyChannelReferenceFieldName) {
      return undefined;
    }
    return order.custom?.fields[supplyChannelReferenceFieldName];
  }

  private mapTags(commercetoolsOrder: CommercetoolsOrder, configuration?: Configuration): TagReference[] {
    const tags: TagReference[] = [];
    if (configuration?.storeTagMapping && commercetoolsOrder.store?.key) {
      tags.push({
        id: configuration.storeTagMapping,
        value: commercetoolsOrder.store?.key,
      });
    }
    if (configuration?.customFieldTagMapping) {
      for (const fieldName of Object.keys(configuration.customFieldTagMapping)) {
        const value = this.mapTagValue(commercetoolsOrder, fieldName);
        if (value !== undefined) {
          tags.push({
            id: configuration.customFieldTagMapping[fieldName],
            value,
          });
        }
      }
    }
    return tags;
  }

  /**
   * `TagReference.value` is a string in the fft API, so an object-valued custom
   * field can never be a valid tag value - and it takes the whole order down
   * with a 400. Skip what cannot work instead, and say so in the log.
   *
   * Length is deliberately not checked: the fft API defines no maximum for tag
   * values, so a long value can be perfectly valid and must not be dropped.
   */
  private mapTagValue(commercetoolsOrder: CommercetoolsOrder, fieldName: string): string | undefined {
    const value = commercetoolsOrder.custom?.fields[fieldName];
    if (!value) {
      return undefined;
    }
    if (typeof value === 'object') {
      logger.warn(
        `Custom field '${fieldName}' of CT order '${commercetoolsOrder.id}' is not a scalar value and cannot be mapped to a tag`
      );
      return undefined;
    }
    return String(value);
  }
}
