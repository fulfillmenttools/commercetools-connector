import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { Project } from '@commercetools/composable-commerce-test-data/project';

export const handlers = [
  http.get(ctApi(''), () => {
    return HttpResponse.json(
      Project.random().key('').name('').countries(['DE']).currencies(['EUR']).languages(['de-DE', 'en-US']).buildRest()
    );
  }),
];
