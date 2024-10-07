import { beforeAll, describe, expect, it } from '@jest/globals';
import express, { Express } from 'express';
import { sign } from 'jsonwebtoken';
import request from 'supertest';

import { ServiceRouter } from '../src/routes/serviceRouter';
import { getTestClient } from 'shared';
import { readConfiguration } from 'shared';
import {
  orderCreatedEvent,
  pickJobCreatedEvent,
  pickJobFinishedEvent,
  handoverCreatedEvent,
  handoverHandedOverEvent,
} from '../src/routes/eventFixtures';
import { URLType } from 'superagent/types';

describe('Protected Service Router', () => {
  let app: Express;
  let router: ServiceRouter;

  beforeAll(() => {
    router = new ServiceRouter(getTestClient());
    app = express();
    app.use(express.json());
    app.use('/service', router.getRouter());
  });

  describe('Endpoint', () => {
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when no Bearer token is presented', async ({ path, event }) => {
      const res = await request(app)
        .post(path as URLType)
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when Bearer token is empty', async ({ path, event }) => {
      const token = '';
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when JWT audience is invalid', async ({ path, event }) => {
      const token = createToken({ audience: 'wrong' });
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when JWT issuer is invalid', async ({ path, event }) => {
      const token = createToken({ issuer: 'wrong' });
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when JWT subject is invalid', async ({ path, event }) => {
      const token = createToken({ subject: 'wrong' });
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when JWT is expired', async ({ path, event }) => {
      const token = createToken({ expiresIn: '-1h' });
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when JWT signature is invalid', async ({ path, event }) => {
      const token = createTokenWithSecret(readConfiguration().jwtSecret.split('').reverse().join(''));
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
    it.each`
      path                                 | event
      ${'/service/order/created'}          | ${orderCreatedEvent}
      ${'/service/pickjob/created'}        | ${pickJobCreatedEvent}
      ${'/service/pickjob/finished'}       | ${pickJobFinishedEvent}
      ${'/service/handoverjob/created'}    | ${handoverCreatedEvent}
      ${'/service/handoverjob/handedover'} | ${handoverHandedOverEvent}
    `('[$path] should reject request when JWT algorithm is invalid', async ({ path, event }) => {
      const token = createToken({ algorithm: 'none' });
      const res = await request(app)
        .post(path as URLType)
        .auth(token, { type: 'bearer' })
        .send(event as string);
      expect(res.statusCode).toEqual(401);
    });
  });
});

function createTokenWithSecret(secret: string, initialValue = {}): string {
  return sign({}, secret, {
    expiresIn: '1h',
    algorithm: 'HS256',
    audience: readConfiguration().jwtAudience,
    issuer: readConfiguration().jwtIssuer,
    subject: readConfiguration().jwtSubject,
    ...initialValue,
  });
}

function createToken(initialValue = {}): string {
  return createTokenWithSecret(readConfiguration().jwtSecret, initialValue);
}
