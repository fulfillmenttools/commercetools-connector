import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

jest.mock('../src/client', () => {
  const actual = jest.requireActual('../src/client') as { createApiRoot: () => unknown };
  return { createApiRoot: jest.fn(() => actual.createApiRoot()) };
});

import { getProject } from '../src/commercetools/projectService';
import { ctApi, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';
import * as clientModule from '../src/client';

beforeEach(() => {
  const actual = jest.requireActual('../src/client') as typeof clientModule;
  jest.mocked(clientModule.createApiRoot).mockImplementation(() => actual.createApiRoot());
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProjectService', () => {
  it('should return project', async () => {
    const project = await getProject();
    expect(project).toBeDefined();
  });

  it('should handle errors', async () => {
    server.use(
      http.get(ctApi(''), () => {
        return HttpResponse.json(mockError(), { status: 500 });
      })
    );
    await expect(async () => {
      await getProject();
    }).rejects.toThrow(CustomError);
  });

  describe('non-throwing SDK status branches', () => {
    it('throws on a non-200 result in the try block', async () => {
      jest.mocked(clientModule.createApiRoot).mockReturnValue({
        get: () => ({ execute: async () => ({ statusCode: 503 }) }),
      } as unknown as ReturnType<typeof clientModule.createApiRoot>);
      await expect(getProject()).rejects.toThrow(CustomError);
    });
  });
});
