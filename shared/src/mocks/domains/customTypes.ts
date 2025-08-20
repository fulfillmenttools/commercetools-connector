import { http, HttpResponse } from 'msw';

import { ctApi } from '../baseUrls';
import { CUSTOM_TYPE_NAME } from '../../common';

import { Type } from '@commercetools/composable-commerce-test-data/type';

export function mockCustomType(id?: string) {
  return (
    Type.random()
      .id(id || '509e9063-75f5-49b4-886a-c1bc10ffc3fb')
      .key(CUSTOM_TYPE_NAME)
      // .name({
      //   en: 'My Custom Type',
      // })
      // .description({
      //   en: 'A very nice custom type',
      // })
      .resourceTypeIds(['order'])
      .fieldDefinitions([])
      .build()
  );
}
export const handlers = [
  http.get(ctApi(`/types/key=${CUSTOM_TYPE_NAME}`), () => {
    return HttpResponse.json(mockCustomType());
  }),
  http.get<{ id: string }>(ctApi('/types/:id'), ({ params }) => {
    return HttpResponse.json(mockCustomType(params.id));
  }),
  http.post<{ id: string }>(ctApi(`/types`), () => {
    return HttpResponse.json(mockCustomType(), { status: 201 });
  }),
  http.post<{ id: string }>(ctApi(`/types/:id`), ({ params }) => {
    return HttpResponse.json(mockCustomType(params.id));
  }),
];
