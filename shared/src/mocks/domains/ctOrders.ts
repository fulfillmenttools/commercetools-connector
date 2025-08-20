import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { OrderRest } from '@commercetools/composable-commerce-test-data/order';

export const handlers = [
  http.get<{ id: string }>(ctApi('/orders/:id'), ({ params }) => {
    return HttpResponse.json(OrderRest.random().id(params.id).buildRest());
  }),
  http.post<{ id: string }>(ctApi('/orders/:id'), ({ params }) => {
    return HttpResponse.json(OrderRest.random().id(params.id).buildRest());
  }),
];
