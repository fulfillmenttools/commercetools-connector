import { rest } from 'msw';

import { ctApi } from '../baseUrls';
import { mockCustomObject } from '../ctEntities';
import {
  CUSTOM_OBJECT_CONTAINER,
  CUSTOM_OBJECT_KEY,
  CUSTOM_TYPE_NAME,
  SUPPLY_CHANNEL_REFERENCE_FIELD_NAME,
} from '../../common';
import { ServiceType, ShippingMethodMapping } from '../../types';
import { DeliveryPreferencesShipping } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import ServiceLevelEnum = DeliveryPreferencesShipping.ServiceLevelEnum;

const shippingMethodMapping: ShippingMethodMapping = {
  dhl: { serviceType: ServiceType.SHIPPING, serviceLevel: ServiceLevelEnum.DELIVERY, carriers: ['DHL_V2'] },
  cc: { serviceType: ServiceType.CLICK_AND_COLLECT },
};

export const handlers = [
  rest.get(ctApi(`/custom-objects/${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`), (_req, res, ctx) => {
    return res(
      ctx.json(
        mockCustomObject({
          value: {
            orderCustomTypeKey: CUSTOM_TYPE_NAME,
            shippingMethodMapping,
            collectChannelReferenceFieldName: SUPPLY_CHANNEL_REFERENCE_FIELD_NAME,
          },
        })
      )
    );
  }),
  rest.get(ctApi('/custom-objects/:container/:key'), (req, res, ctx) => {
    return res(ctx.json(mockCustomObject({ container: req.params.container, key: req.params.key })));
  }),
];
