import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { rest } from 'msw';

import { getProject } from '../src/commercetools/projectService';
import { ctApi, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';

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
      rest.get(ctApi(''), (_req, res, ctx) => {
        return res(ctx.status(500), ctx.json(mockError()));
      })
    );
    await expect(async () => {
      await getProject();
    }).rejects.toThrow(CustomError);
  });
});
