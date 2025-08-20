import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';

import { StoreRest } from '@commercetools/composable-commerce-test-data/store';
import { ChannelRest } from '@commercetools/composable-commerce-test-data/channel';

const channelCologne = ChannelRest.random().id('12345').key('store_cologne').roles([]);
const channelHamburg = ChannelRest.random().id('54321').key('store_hamburg').roles([]);

export const handlers = [
  http.get(ctApi('/stores/key=store_01'), ({ request }) => {
    const store = StoreRest.random()
      .supplyChannels([channelCologne, channelHamburg])
      .countries([])
      .id('1123456789')
      .key('store_02')
      .languages([])
      .productSelections([])
      .distributionChannels([])
      .buildRest();
    const url = new URL(request.url);
    const expand = url.searchParams.get('expand');
    if (expand === 'supplyChannels[*]') {
      store.supplyChannels.map((value) => {
        return { id: value.id, typeId: value.id, obj: value };
      });
      return HttpResponse.json({
        ...store,
        supplyChannels: store.supplyChannels.map((value) => {
          return { id: value.id, typeId: value.id, obj: value };
        }),
      });
    }
    return HttpResponse.json(store);
  }),
];
