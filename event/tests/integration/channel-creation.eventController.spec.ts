import request from 'supertest';
import app from '../../src/app';
import { faker } from '@faker-js/faker/.';
import { ChannelRest } from '@commercetools/composable-commerce-test-data/channel';
import { ResourceCreatedDeliveryPayload, IMessage } from '@commercetools/platform-sdk';

describe('Testing Channel Creation', () => {
  it.skip('Channel Created', async () => {
    // The integration used the id of the channel to load it and communication with fft.
    // So all we need to "mock" is the id.
    const channel = ChannelRest.random().id('9df1334f-cbb4-4b71-a8ed-c6227f6c3dd0').buildRest();

    const channelCreatedMessage: IMessage & ResourceCreatedDeliveryPayload = {
      createdAt: faker.date.past().toISOString(),
      id: faker.string.uuid(),
      lastModifiedAt: faker.date.past().toISOString(),
      modifiedAt: faker.date.past().toISOString(),
      resource: { id: channel.id, typeId: 'channel' },
      resourceVersion: faker.number.int(),
      sequenceNumber: faker.number.int(),
      type: 'ResourceCreated',
      version: faker.number.int(),
      notificationType: 'ResourceCreated',
      projectKey: 'projectKey',
    };

    const res = await request(app)
      .post('/event')
      .send({ message: { data: Buffer.from(JSON.stringify(channelCreatedMessage)).toString('base64') } });

    expect(res.statusCode).toBe(201);
  });
});
