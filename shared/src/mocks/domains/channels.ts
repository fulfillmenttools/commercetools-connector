import { rest } from 'msw';

import { ctApi } from '../baseUrls';
import { mockChannel } from '../ctEntities';

export const handlers = [
  rest.get(ctApi('/channels/:id'), (req, res, ctx) => {
    return res(ctx.json(mockChannel({ id: req.params.id })));
  }),
];
