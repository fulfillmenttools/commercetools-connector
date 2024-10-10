import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { mockChannel } from '../ctEntities';

export const handlers = [
  http.get(ctApi('/channels/:id'), ({ params }) => {
    return HttpResponse.json(mockChannel({ id: params.id }));
  }),
];
