import { rest } from 'msw';

import { ctApi } from '../baseUrls';
import { mockCtOrder } from '../ctEntities';

export const handlers = [
  rest.get(ctApi('/orders/:id'), (req, res, ctx) => {
    return res(ctx.json(mockCtOrder({ id: req.params.id })));
  }),
  rest.post(ctApi('/orders/:id'), (req, res, ctx) => {
    return res(ctx.json(mockCtOrder({ id: req.params.id })));
  }),
];
