import { OrderCreatedMessage, MessageDeliveryPayload } from '@commercetools/platform-sdk';
import { OrderRest } from '@commercetools/composable-commerce-test-data/order';
import request from 'supertest';
import app from '../../src/app';
import { faker } from '@faker-js/faker/.';

describe('Testing Order Creation', () => {
  it.skip('Order Created', async () => {
    // The integration used the id of the order to load it and communication with fft.
    // So all we need to "mock" is the id.
    const order = OrderRest.random().id('0e9c604a-9537-4b2c-8421-7363696052a0').buildRest();

    const orderCreatedMessage: OrderCreatedMessage & MessageDeliveryPayload = {
      createdAt: faker.date.past().toISOString(),
      id: faker.string.uuid(),
      lastModifiedAt: faker.date.past().toISOString(),
      resource: { id: order.id, typeId: 'order' },
      resourceVersion: faker.number.int(),
      sequenceNumber: faker.number.int(),
      type: 'OrderCreated',
      version: faker.number.int(),
      notificationType: 'Message',
      projectKey: 'projectKey',
      order: order,
    };

    const res = await request(app)
      .post('/event')
      .send({ message: { data: Buffer.from(JSON.stringify(orderCreatedMessage)).toString('base64') } });

    expect(res.statusCode).toBe(201);
  });
});
