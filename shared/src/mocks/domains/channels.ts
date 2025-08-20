import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { ChannelRest } from '@commercetools/composable-commerce-test-data/channel';
import { Address } from '@commercetools/composable-commerce-test-data/commons';

export const handlers = [
  http.get<{ id: string }>(ctApi('/channels/:id'), ({ params }) => {
    return HttpResponse.json(
      ChannelRest.random()
        .id(params.id)
        .key('store_cologne')
        .roles(['InventorySupply', 'ProductDistribution'])
        .name({
          'de-DE': 'Köln',
          'en-US': 'Cologne',
        })
        .address(
          Address.random()
            .streetName('Schanzenstr.')
            .streetNumber('6-20')
            .postalCode('51063')
            .city('Köln')
            .region('')
            .state('NRW')
            .country('DE')
        )
        .buildRest()
    );
  }),
];
