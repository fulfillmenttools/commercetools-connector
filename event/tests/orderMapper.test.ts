import { describe, expect } from '@jest/globals';
import { OrderMapper } from '../src/order/orderMapper';
import {
  getTestOrder,
  getTestOrderClickAndCollect,
  getTestOrderClickAndCollectNoChannels,
  getTestOrderClickAndCollectWithCustomField,
  getTestOrderClickAndCollectWithMultipleChannels,
  getTestOrderWithDHL,
  getTestOrderWithoutOrderNumber,
  getTestOrderWithStore,
} from '../src/order/testModels';
import { FftFacilityService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { StoreService } from 'shared';
import { server } from 'shared';
import { getTestClient } from 'shared';
import { AmbiguousChannelError } from 'shared';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('OrderMapper', () => {
  const facilityService: FftFacilityService = new FftFacilityService(getTestClient());

  const orderMapper = new OrderMapper(new StoreService(), facilityService);
  it('maps Correctly', async () => {
    const commercetoolsOrder = getTestOrder();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);

    expect(fulfillmenttoolsOrder.orderDate).toEqual(new Date('2023-04-27T14:31:52.004Z'));
    expect(fulfillmenttoolsOrder.consumer.email).toEqual('max.mustermann@fulfillmenttools.com');
    expect(fulfillmenttoolsOrder.consumer.addresses).toHaveLength(1);
    const consumerAddress = fulfillmenttoolsOrder.consumer.addresses[0];
    expect(consumerAddress).toBeDefined();
    expect(consumerAddress.city).toEqual('Köln');
    expect(consumerAddress.street).toEqual('Schanzenstraße');
    expect(consumerAddress.houseNumber).toEqual('30');
    expect(consumerAddress.postalCode).toEqual('51063');
    expect(consumerAddress.firstName).toEqual('Max');
    expect(consumerAddress.lastName).toEqual('Mustermann');
    expect(consumerAddress.additionalAddressInfo).toEqual('second floor');
    expect(consumerAddress.companyName).toEqual('Fulfillmenttools');

    expect(fulfillmenttoolsOrder.orderLineItems).toHaveLength(1);
    const orderLineItem = fulfillmenttoolsOrder.orderLineItems[0];
    expect(orderLineItem).toBeDefined();
    expect(orderLineItem.quantity).toEqual(1);
    expect(orderLineItem.article).toBeDefined();
    const article = orderLineItem.article;
    expect(article.tenantArticleId).toEqual('tenantArticleId');
    expect(article.title).toEqual('Cigköfte Wrap');
    expect(article.imageUrl).toEqual('https://fancy-image.example.com');
    expect(fulfillmenttoolsOrder.tenantOrderId).toEqual('orderNumber');
  });

  it('defaults to id if orderNumber is undefined', async () => {
    const commercetoolsOrder = getTestOrderWithoutOrderNumber();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.tenantOrderId).toEqual('orderId');
  });

  it('maps preselected facilities if a store is defined', async () => {
    const commercetoolsOrder = getTestOrderWithStore();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    const preselectedFacilities = fulfillmenttoolsOrder.deliveryPreferences?.shipping?.preselectedFacilities;
    expect(preselectedFacilities).toBeDefined();
    expect(preselectedFacilities).toHaveLength(2);
    expect(preselectedFacilities?.[0].facilityRef).toEqual('store_cologne_fft_id');
    expect(preselectedFacilities?.[1].facilityRef).toEqual('store_hamburg_fft_id');
  });
  it('maps shipping method correctly to carrier', async () => {
    const commercetoolsOrder = getTestOrderWithDHL();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.deliveryPreferences?.shipping?.preferredCarriers).toEqual(['DHL_V2']);
  });
  it('maps shipping method correctly to click and collect', async () => {
    const commercetoolsOrder = getTestOrderClickAndCollect();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.deliveryPreferences?.collect?.[0].facilityRef).toEqual('store_cologne_fft_id');
  });
  it('rejects click and collect order if no custom field is set and line items contain multiple distinct supply channels', async () => {
    const commercetoolsOrder = getTestOrderClickAndCollectWithMultipleChannels();
    await expect(orderMapper.mapOrder(commercetoolsOrder)).rejects.toThrow(AmbiguousChannelError);
  });
  it('rejects click and collect order if no custom field is set and line items contain no channel', async () => {
    const commercetoolsOrder = getTestOrderClickAndCollectNoChannels();
    await expect(orderMapper.mapOrder(commercetoolsOrder)).rejects.toThrow(AmbiguousChannelError);
  });
  it('maps shipping method correctly to click and collect and custom field', async () => {
    const commercetoolsOrder = getTestOrderClickAndCollectWithCustomField();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.deliveryPreferences?.collect?.[0].facilityRef).toEqual('store_hamburg_fft_id');
  });
});
