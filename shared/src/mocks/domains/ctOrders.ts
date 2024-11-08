import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { mockCtOrder } from '../ctEntities';

export const handlers = [
  http.get(ctApi('/orders/:id'), ({ params }) => {
    return HttpResponse.json(mockCtOrder({ id: params.id }));
  }),
  http.post(ctApi('/orders/:id'), ({ params }) => {
    return HttpResponse.json(mockCtOrder({ id: params.id }));
  }),
];
