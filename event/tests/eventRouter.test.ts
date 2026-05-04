import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';

import { EventRouter } from '../src/routes/eventRouter';
import { fftApi, getTestClient, http, HttpResponse, server } from 'shared';

function encodeMessage(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function pubSubBody(data: object) {
  return { message: { data: encodeMessage(data) } };
}

const orderConfirmedBody = pubSubBody({
  id: 'msg-001',
  version: 1,
  projectKey: 'dummy-project',
  type: 'OrderStateChanged',
  resource: { typeId: 'order', id: 'order-abc-123' },
  notificationType: 'Message',
  orderState: 'Confirmed',
  createdAt: '2023-01-01T00:00:00.000Z',
  lastModifiedAt: '2023-01-01T00:00:00.000Z',
  sequenceNumber: 1,
  resourceVersion: 1,
});

const channelCreatedBody = pubSubBody({
  id: 'msg-002',
  version: 1,
  projectKey: 'dummy-project',
  type: 'ResourceCreated',
  resource: { typeId: 'channel', id: 'f348e5c2-e2db-4cf3-b254-41220801d2c6' },
  notificationType: 'ResourceCreated',
  resourceUserProvidedIdentifiers: { key: 'channel_01' },
  createdAt: '2023-01-01T00:00:00.000Z',
  lastModifiedAt: '2023-01-01T00:00:00.000Z',
  sequenceNumber: 1,
  resourceVersion: 1,
});

describe('Event Router', () => {
  let app: Express;
  let router: EventRouter;

  beforeAll(() => {
    router = new EventRouter(getTestClient());
    app = express();
    app.use(express.json());
    app.use('/event', router.getRouter());
    server.listen();
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Status endpoint', () => {
    it('should be UP', async () => {
      const res = await request(app).get('/event/status');
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST endpoint', () => {
    const path = '/event/';

    it('should reject empty request body', async () => {
      const res = await request(app).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request without message field', async () => {
      const res = await request(app).post(path).send({ notMessage: 'wrong' });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with non-string message data', async () => {
      const res = await request(app).post(path).send({ message: { data: 12345 } });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject request with invalid JSON in message data', async () => {
      const res = await request(app)
        .post(path)
        .send({ message: { data: Buffer.from('not-valid-json{{{').toString('base64') } });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject message without resource reference', async () => {
      const res = await request(app)
        .post(path)
        .send(pubSubBody({ id: 'msg-x', notificationType: 'Message', projectKey: 'test' }));
      expect(res.statusCode).toEqual(400);
    });

    it('should reject message without notificationType', async () => {
      const res = await request(app)
        .post(path)
        .send(pubSubBody({ id: 'msg-x', resource: { typeId: 'order', id: 'order-1' }, projectKey: 'test' }));
      expect(res.statusCode).toEqual(400);
    });

    it('should reject message with unsupported resource type', async () => {
      const body = pubSubBody({
        id: 'msg-x',
        version: 1,
        projectKey: 'dummy-project',
        type: 'ProductCreated',
        resource: { typeId: 'product', id: 'prod-123' },
        notificationType: 'ResourceCreated',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModifiedAt: '2023-01-01T00:00:00.000Z',
        sequenceNumber: 1,
        resourceVersion: 1,
      });
      const res = await request(app).post(path).send(body);
      expect(res.statusCode).toEqual(400);
    });

    it('should silently accept subscription resource type', async () => {
      const body = pubSubBody({
        id: 'msg-sub',
        version: 1,
        projectKey: 'dummy-project',
        type: 'ResourceCreated',
        resource: { typeId: 'subscription', id: 'sub-123' },
        notificationType: 'ResourceCreated',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModifiedAt: '2023-01-01T00:00:00.000Z',
        sequenceNumber: 1,
        resourceVersion: 1,
      });
      const res = await request(app).post(path).send(body);
      expect(res.statusCode).toEqual(201);
    });

    it('should process a valid confirmed order message and return 201', async () => {
      const res = await request(app).post(path).send(orderConfirmedBody);
      expect(res.statusCode).toEqual(201);
    });

    it('should process a valid channel created message and return 201', async () => {
      const res = await request(app).post(path).send(channelCreatedBody);
      expect(res.statusCode).toEqual(201);
    });

    it('should process an order created with confirmed state and return 201', async () => {
      const body = pubSubBody({
        id: 'msg-003',
        version: 1,
        projectKey: 'dummy-project',
        type: 'OrderCreated',
        resource: { typeId: 'order', id: 'order-created-123' },
        notificationType: 'Message',
        order: { orderState: 'Confirmed' },
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModifiedAt: '2023-01-01T00:00:00.000Z',
        sequenceNumber: 1,
        resourceVersion: 1,
      });
      const res = await request(app).post(path).send(body);
      expect(res.statusCode).toEqual(201);
    });

    it('should process a cancelled order message and return 201', async () => {
      // Override FFT orders to return nothing so cancelOrder takes the "nothing to cancel" path
      server.use(
        http.get(fftApi('/orders'), () => HttpResponse.json({ total: 0, orders: [] }))
      );
      const body = pubSubBody({
        id: 'msg-004',
        version: 1,
        projectKey: 'dummy-project',
        type: 'OrderStateChanged',
        resource: { typeId: 'order', id: 'order-cancel-123' },
        notificationType: 'Message',
        orderState: 'Cancelled',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModifiedAt: '2023-01-01T00:00:00.000Z',
        sequenceNumber: 1,
        resourceVersion: 1,
      });
      const res = await request(app).post(path).send(body);
      expect(res.statusCode).toEqual(201);
    });
  });
});
