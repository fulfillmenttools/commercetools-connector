import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';

jest.mock('shared', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = jest.requireActual('shared') as any;
  return { ...actual, readConfiguration: jest.fn() };
});

import { EventRouter } from '../src/routes/eventRouter';
import { fftApi, getTestClient, http, HttpResponse, readConfiguration, server } from 'shared';

import * as sharedModule from 'shared';
const realConfig = (jest.requireActual('shared') as typeof sharedModule).readConfiguration();

function encodeMessage(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function pubSubBody(data: object) {
  return { message: { data: encodeMessage(data) } };
}

describe('EventController', () => {
  let app: Express;
  let bareApp: Express;

  beforeAll(() => {
    const router = new EventRouter(getTestClient());
    app = express();
    app.use(express.json());
    app.use('/event', router.getRouter());
    bareApp = express();
    bareApp.use('/event', router.getRouter());
    server.listen();
  });

  beforeEach(() => {
    jest.mocked(readConfiguration).mockReturnValue(realConfig);
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const path = '/event/';

  describe('validateMessage branches', () => {
    it('returns 400 when request body is absent (no body-parser middleware)', async () => {
      const res = await request(bareApp).post(path);
      expect(res.statusCode).toEqual(400);
    });

    it('returns 400 when message.data is an empty string', async () => {
      const res = await request(app).post(path).send({ message: { data: '' } });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('processMessage feature flag branches', () => {
    it('returns 201 and skips order processing when featOrdersyncActive is "false"', async () => {
      jest.mocked(readConfiguration).mockReturnValue({ ...realConfig, featOrdersyncActive: 'false' });
      const res = await request(app)
        .post(path)
        .send(
          pubSubBody({
            id: 'msg-feat-order',
            version: 1,
            projectKey: 'dummy-project',
            type: 'OrderStateChanged',
            resource: { typeId: 'order', id: 'order-feat-123' },
            notificationType: 'Message',
            orderState: 'Confirmed',
            createdAt: '2023-01-01T00:00:00.000Z',
            lastModifiedAt: '2023-01-01T00:00:00.000Z',
            sequenceNumber: 1,
            resourceVersion: 1,
          })
        );
      expect(res.statusCode).toEqual(201);
    });

    it('returns 201 and skips channel processing when featChannelsyncActive is "false"', async () => {
      jest.mocked(readConfiguration).mockReturnValue({ ...realConfig, featChannelsyncActive: 'false' });
      const res = await request(app)
        .post(path)
        .send(
          pubSubBody({
            id: 'msg-feat-channel',
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
          })
        );
      expect(res.statusCode).toEqual(201);
    });
  });

  describe('isChannelMessage branch coverage', () => {
    it('returns 201 for a ResourceDeleted channel message (covers the third || arm of isChannelMessage)', async () => {
      const res = await request(app)
        .post(path)
        .send(
          pubSubBody({
            id: 'msg-chan-deleted',
            version: 1,
            projectKey: 'dummy-project',
            type: 'ResourceDeleted',
            resource: { typeId: 'channel', id: 'f348e5c2-e2db-4cf3-b254-41220801d2c6' },
            notificationType: 'ResourceDeleted',
            resourceUserProvidedIdentifiers: { key: 'channel_01' },
            createdAt: '2023-01-01T00:00:00.000Z',
            lastModifiedAt: '2023-01-01T00:00:00.000Z',
            sequenceNumber: 1,
            resourceVersion: 1,
          })
        );
      expect(res.statusCode).toEqual(201);
    });
  });

  describe('isOrderDeletedMessage branch', () => {
    it('returns 201 for an OrderDeleted message (covers isOrderStateCancelledMessage false-return + isOrderDeletedMessage body)', async () => {
      server.use(http.get(fftApi('/orders'), () => HttpResponse.json({ total: 0, orders: [] })));
      const res = await request(app)
        .post(path)
        .send(
          pubSubBody({
            id: 'msg-deleted',
            version: 1,
            projectKey: 'dummy-project',
            type: 'OrderDeleted',
            resource: { typeId: 'order', id: 'order-deleted-123' },
            notificationType: 'Message',
            createdAt: '2023-01-01T00:00:00.000Z',
            lastModifiedAt: '2023-01-01T00:00:00.000Z',
            sequenceNumber: 1,
            resourceVersion: 1,
          })
        );
      expect(res.statusCode).toEqual(201);
    });
  });
});
