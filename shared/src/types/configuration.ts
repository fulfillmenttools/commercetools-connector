import { DeliveryPreferencesShipping } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import ServiceLevelEnum = DeliveryPreferencesShipping.ServiceLevelEnum;

export type Configuration = {
  orderCustomTypeKey?: string;
  collectChannelReferenceFieldName?: string;
  shippingMethodMapping?: ShippingMethodMapping;
  customFieldTagMapping?: CustomFieldTagMapping;
  storeTagMapping?: string;
};

export type CustomFieldTagMapping = Record<string, string>;

export type ShippingMethodMapping = Record<string, DeliveryConfiguration>;

export enum ServiceType {
  SHIPPING = 'SHIPPING',
  CLICK_AND_COLLECT = 'CLICK_AND_COLLECT',
}

type DeliveryConfiguration = {
  serviceLevel?: ServiceLevelEnum;
  serviceType: ServiceType;
  carriers?: string[];
};
