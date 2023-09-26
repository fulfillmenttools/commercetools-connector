import { describe, expect } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';

import { ServiceRouter } from '../src/routes/serviceRouter';
import { server } from 'shared';
import { getTestClient } from 'shared';
import {
  orderCreatedEvent,
  pickJobCreatedEvent,
  pickJobFinishedEvent,
  handoverCreatedEvent,
  handoverHandedOverEvent,
} from '../src/routes/eventFixtures';

describe('Service Router', () => {
  let app: Express;
  let router: ServiceRouter;

  beforeAll(() => {
    router = new ServiceRouter(getTestClient(), false);
    app = express();
    app.use(express.json());
    app.use('/service', router.getRouter());
    server.listen();
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  describe('Status endpoint', () => {
    it('should be UP', async () => {
      const res = await request(app).get('/service/status');
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('Order Created endpoint', () => {
    const path = '/service/order/created';
    it('should reject empty request body', async () => {
      const res = await request(app).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request without payload', async () => {
      const res = await request(app).post(path).send({});
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with undefined payload', async () => {
      const res = await request(app)
        .post(path)
        .send({ eventId: '974d575f-a69e-4f5d-a1fc-5df0149ea6f5', event: 'ORDER_CREATED' });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with wrong event type', async () => {
      const res = await request(app)
        .post(path)
        .send({
          eventId: '3f8ab6ae-478e-4b67-aa23-2c6acf34cf35',
          event: 'ORDER_CANCELLED',
          payload: { id: 'c523c700-4432-4020-98f2-e714a45c0105', version: 1 },
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should process request with valid payload', async () => {
      const res = await request(app).post(path).send(orderCreatedEvent);
      expect(res.statusCode).toEqual(201);
      expect(res.type).toMatch(/json/);
      expect(res.body.id).toBe(orderCreatedEvent.payload.id);
    });
  });

  describe('PickJob Created endpoint', () => {
    const path = '/service/pickjob/created';
    it('should reject empty request body', async () => {
      const res = await request(app).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request without payload', async () => {
      const res = await request(app).post(path).send({});
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with undefined payload', async () => {
      const res = await request(app)
        .post(path)
        .send({ eventId: '974d575f-a69e-4f5d-a1fc-5df0149ea6f5', event: 'PICK_JOB_CREATED' });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with wrong event type', async () => {
      const res = await request(app)
        .post(path)
        .send({
          eventId: '3f8ab6ae-478e-4b67-aa23-2c6acf34cf35',
          event: 'PICK_JOB_ABORTED',
          payload: { id: 'c523c700-4432-4020-98f2-e714a45c0105', version: 1 },
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should process request with valid payload', async () => {
      const res = await request(app).post(path).send(pickJobCreatedEvent);
      expect(res.statusCode).toEqual(201);
      expect(res.type).toMatch(/json/);
      expect(res.body.id).toBe(pickJobCreatedEvent.payload.id);
    });
  });

  describe('PickJob Finished endpoint', () => {
    const path = '/service/pickjob/finished';
    it('should reject empty request body', async () => {
      const res = await request(app).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request without payload', async () => {
      const res = await request(app).post(path).send({});
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with undefined payload', async () => {
      const res = await request(app)
        .post(path)
        .send({ eventId: '974d575f-a69e-4f5d-a1fc-5df0149ea6f5', event: 'PICK_JOB_PICKING_FINISHED' });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with wrong event type', async () => {
      const res = await request(app)
        .post(path)
        .send({
          eventId: '3f8ab6ae-478e-4b67-aa23-2c6acf34cf35',
          event: 'PICK_JOB_ABORTED',
          payload: { id: 'c523c700-4432-4020-98f2-e714a45c0105', version: 1 },
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should process request with valid payload', async () => {
      const res = await request(app).post(path).send(pickJobFinishedEvent);
      expect(res.statusCode).toEqual(201);
      expect(res.type).toMatch(/json/);
      expect(res.body.id).toBe(pickJobFinishedEvent.payload.id);
    });
  });

  describe('HandoverJob Created endpoint', () => {
    const path = '/service/handoverjob/created';
    it('should reject empty request body', async () => {
      const res = await request(app).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request without payload', async () => {
      const res = await request(app).post(path).send({});
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with undefined payload', async () => {
      const res = await request(app)
        .post(path)
        .send({ eventId: '974d575f-a69e-4f5d-a1fc-5df0149ea6f5', event: 'HANDOVERJOB_CREATED' });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with wrong event type', async () => {
      const res = await request(app)
        .post(path)
        .send({
          eventId: '3f8ab6ae-478e-4b67-aa23-2c6acf34cf35',
          event: 'PICK_JOB_ABORTED',
          payload: { id: 'c523c700-4432-4020-98f2-e714a45c0105', version: 1 },
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should process request with valid payload', async () => {
      const res = await request(app).post(path).send(handoverCreatedEvent);
      expect(res.statusCode).toEqual(201);
      expect(res.type).toMatch(/json/);
      expect(res.body.id).toBe(handoverCreatedEvent.payload.id);
    });
  });

  describe('HandoverJob Handedover endpoint', () => {
    const path = '/service/handoverjob/handedover';
    it('should reject empty request body', async () => {
      const res = await request(app).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request without payload', async () => {
      const res = await request(app).post(path).send({});
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with undefined payload', async () => {
      const res = await request(app)
        .post(path)
        .send({ eventId: '974d575f-a69e-4f5d-a1fc-5df0149ea6f5', event: 'HANDOVERJOB_HANDED_OVER' });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with wrong event type', async () => {
      const res = await request(app)
        .post(path)
        .send({
          eventId: '3f8ab6ae-478e-4b67-aa23-2c6acf34cf35',
          event: 'PICK_JOB_ABORTED',
          payload: { id: 'c523c700-4432-4020-98f2-e714a45c0105', version: 1 },
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should process request with valid payload', async () => {
      const res = await request(app).post(path).send(handoverHandedOverEvent);
      expect(res.statusCode).toEqual(201);
      expect(res.type).toMatch(/json/);
      expect(res.body.id).toBe(handoverHandedOverEvent.payload.id);
    });
  });
});
