import { rest } from 'msw';

import { ctApi } from '../baseUrls';
import { channelCologne, channelHamburg, mockStore } from '../ctEntities';

export const handlers = [
  rest.get(ctApi('/stores/key=store_01'), (req, res, ctx) => {
    const expand = req.url.searchParams.get('expand');
    if (expand === 'supplyChannels[*]') {
      return res(
        ctx.json(
          mockStore({
            supplyChannels: [
              { typeId: 'channel', id: channelCologne.id, obj: channelCologne },
              { typeId: 'channel', id: channelHamburg.id, obj: channelHamburg },
            ],
          })
        )
      );
    }
    return res(
      ctx.json(
        mockStore({
          supplyChannels: [
            { typeId: 'channel', id: channelCologne.id },
            { typeId: 'channel', id: channelHamburg.id },
          ],
        })
      )
    );
  }),
];
