import { http, HttpResponse } from 'msw';
import { fftApi } from '../baseUrls';
import { mockFftOrder } from '../fftEntities';

export const handlers = [
  http.get(fftApi('/orders'), ({ request }) => {
    const url = new URL(request.url);
    const tenantOrderId = url.searchParams.get('tenantOrderId');
    return HttpResponse.json({
      total: 1,
      orders: [mockFftOrder({ tenantOrderId })],
    });
  }),
  http.get(fftApi('/orders/:id'), ({ params }) => {
    return HttpResponse.json(mockFftOrder({ id: params.id }));
  }),
];
