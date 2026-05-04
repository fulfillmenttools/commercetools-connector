import { http, HttpResponse } from 'msw';
import { fftApi } from '../baseUrls';
import { mockFftShipment } from '../fftEntities';

export const handlers = [
  http.get(fftApi('/shipments'), ({ request }) => {
    const url = new URL(request.url);
    const tenantOrderId = url.searchParams.get('tenantOrderId');
    return HttpResponse.json({
      total: 1,
      orders: [mockFftShipment({ tenantOrderId })],
    });
  }),
  http.get(fftApi('/shipments/:id'), ({ params }) => {
    return HttpResponse.json(mockFftShipment({ id: params.id }));
  }),
];
