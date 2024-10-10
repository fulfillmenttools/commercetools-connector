import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { mockProject } from '../ctEntities';

export const handlers = [
  http.get(ctApi(''), () => {
    return HttpResponse.json(mockProject());
  }),
];
