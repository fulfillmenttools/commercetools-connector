import { rest } from 'msw';

import { ctApi } from '../baseUrls';
import { mockProject } from '../ctEntities';

export const handlers = [
  rest.get(ctApi(''), (req, res, ctx) => {
    return res(ctx.json(mockProject()));
  }),
];
