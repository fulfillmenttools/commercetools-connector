import { rest } from 'msw';

import { ctApi } from '../baseUrls';
import { mockCustomType } from '../ctEntities';
import { CUSTOM_TYPE_NAME } from '../../common';

export const handlers = [
  rest.get(ctApi(`/types/key=${CUSTOM_TYPE_NAME}`), (_req, res, ctx) => {
    return res(ctx.json(mockCustomType()));
  }),
  rest.get(ctApi('/types/:id'), (req, res, ctx) => {
    return res(ctx.json(mockCustomType({ id: req.params.id })));
  }),
  rest.post(ctApi(`/types`), (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockCustomType()));
  }),
  rest.post(ctApi(`/types/:id`), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockCustomType({ id: req.params.id })));
  }),
];
