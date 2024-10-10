import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { mockCustomObject } from '../ctEntities';
import {
  CUSTOM_OBJECT_CONTAINER,
  CUSTOM_OBJECT_KEY,
  CUSTOM_TYPE_NAME,
  SUPPLY_CHANNEL_REFERENCE_FIELD_NAME,
} from '../../common';
import { CustomFieldTagMapping, ServiceType, ShippingMethodMapping } from '../../types';
import { DeliveryPreferencesShipping } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import ServiceLevelEnum = DeliveryPreferencesShipping.ServiceLevelEnum;

const shippingMethodMapping: ShippingMethodMapping = {
  dhl: { serviceType: ServiceType.SHIPPING, serviceLevel: ServiceLevelEnum.DELIVERY, carriers: ['DHL_V2'] },
  cc: { serviceType: ServiceType.CLICK_AND_COLLECT },
};

const customFieldTagMapping: CustomFieldTagMapping = {
  foo: 'tag_foo',
  bar: 'tag_bar',
};

export const handlers = [
  http.get(ctApi(`/custom-objects/${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`), () => {
    return HttpResponse.json(
      mockCustomObject({
        value: {
          orderCustomTypeKey: CUSTOM_TYPE_NAME,
          shippingMethodMapping,
          collectChannelReferenceFieldName: SUPPLY_CHANNEL_REFERENCE_FIELD_NAME,
          storeTagMapping: 'tag_store',
          customFieldTagMapping,
        },
      })
    );
  }),
  http.get(ctApi('/custom-objects/:container/:key'), ({ params }) => {
    return HttpResponse.json(mockCustomObject({ container: params.container, key: params.key }));
  }),
];
