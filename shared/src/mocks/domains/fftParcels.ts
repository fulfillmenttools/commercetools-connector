import { http, HttpResponse } from 'msw';
import { fftApi } from '../baseUrls';
import { mockFftParcel } from '../fftEntities';

export const handlers = [
  http.get(fftApi('/parcels'), ({ request }) => {
    const url = new URL(request.url);
    const tenantOrderId = url.searchParams.get('tenantOrderId');
    return HttpResponse.json({
      total: 1,
      orders: [mockFftParcel({ tenantOrderId })],
    });
  }),
  http.get(fftApi('/parcels/:id'), ({ params }) => {
    return HttpResponse.json(mockFftParcel({ id: params.id }));
  }),
];
