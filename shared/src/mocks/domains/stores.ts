import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { channelCologne, channelHamburg, mockStore } from '../ctEntities';

export const handlers = [
  http.get(ctApi('/stores/key=store_01'), ({ request }) => {
    const url = new URL(request.url);
    const expand = url.searchParams.get('expand');
    if (expand === 'supplyChannels[*]') {
      return HttpResponse.json(
        mockStore({
          supplyChannels: [
            { typeId: 'channel', id: channelCologne.id, obj: channelCologne },
            { typeId: 'channel', id: channelHamburg.id, obj: channelHamburg },
          ],
        })
      );
    }
    return HttpResponse.json(
      mockStore({
        supplyChannels: [
          { typeId: 'channel', id: channelCologne.id },
          { typeId: 'channel', id: channelHamburg.id },
        ],
      })
    );
  }),
];
