import { rest } from 'msw';
import { fftApi } from '../baseUrls';
import { mockFftOrder } from '../fftEntities';

export const handlers = [
  rest.get(fftApi('/orders'), (req, res, ctx) => {
    const tenantOrderId = req.url.searchParams.get('tenantOrderId');
    return res(
      ctx.json({
        total: 1,
        orders: [mockFftOrder({ tenantOrderId })],
      })
    );
  }),
  rest.get(fftApi('/orders/:id'), (req, res, ctx) => {
    return res(ctx.json(mockFftOrder({ id: req.params.id })));
  }),
];
