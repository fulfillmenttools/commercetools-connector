import { beforeAll, describe, expect, it } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';

import { EventRouter } from '../src/routes/eventRouter';
import { getTestClient } from 'shared';

describe('Event Router', () => {
  let app: Express;
  let router: EventRouter;

  beforeAll(() => {
    router = new EventRouter(getTestClient());
    app = express();
    app.use(express.json());
    app.use('/event', router.getRouter());
  });

  describe('Status endpoint', () => {
    it('should be UP', async () => {
      const res = await request(app).get('/event/status');
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST endpoint', () => {
    it.todo('should reject empty request body');
    it.todo('should reject request without payload');
    it.todo('should reject request with undefined payload');
    it.todo('should reject request with wrong event type');
    it.todo('should process request with valid payload');
  });
});
