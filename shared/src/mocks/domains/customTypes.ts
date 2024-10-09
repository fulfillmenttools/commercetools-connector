import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { mockCustomType } from '../ctEntities';
import { CUSTOM_TYPE_NAME } from '../../common';

export const handlers = [
  http.get(ctApi(`/types/key=${CUSTOM_TYPE_NAME}`), () => {
    return HttpResponse.json(mockCustomType());
  }),
  http.get(ctApi('/types/:id'), ({ params }) => {
    return HttpResponse.json(mockCustomType({ id: params.id }));
  }),
  http.post(ctApi(`/types`), () => {
    return HttpResponse.json(mockCustomType(), { status: 201 });
  }),
  http.post(ctApi(`/types/:id`), ({ params }) => {
    return HttpResponse.json(mockCustomType({ id: params.id }));
  }),
];
