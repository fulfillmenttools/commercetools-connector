import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { OrderMapper } from '../src/order/orderMapper';
import {
  getTestOrder,
  getTestOrderClickAndCollect,
  getTestOrderClickAndCollectNoChannels,
  getTestOrderClickAndCollectWithCustomField,
  getTestOrderClickAndCollectWithMultipleChannels,
  getTestOrderUnknownServiceType,
  getTestOrderWithAttributes,
  getTestOrderWithBillingAddress,
  getTestOrderWithCustomField,
  getTestOrderWithDHL,
  getTestOrderWithFullAddress,
  getTestOrderWithoutOrderNumber,
  getTestOrderWithStore,
} from '../src/order/testModels';
import { AddressPhoneNumbers, AddressType, FftFacilityService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { StoreService } from 'shared';
import { server } from 'shared';
import { getTestClient } from 'shared';
import { AmbiguousChannelError } from 'shared';
import {
  CUSTOM_OBJECT_CONTAINER,
  CUSTOM_OBJECT_KEY,
  CUSTOM_TYPE_NAME,
  ServiceType,
  ctApi,
  http,
  HttpResponse,
  mockCustomObject,
} from 'shared';

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
    expect(fulfillmenttoolsOrder.tags).toBeUndefined();
  });

  it('defaults to id if orderNumber is undefined', async () => {
    const commercetoolsOrder = getTestOrderWithoutOrderNumber();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.tenantOrderId).toEqual('orderId');
  });

  it('maps custom fields to tags', async () => {
    const commercetoolsOrder = getTestOrderWithCustomField();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.tags?.length).toEqual(2);
    expect(fulfillmenttoolsOrder.tags?.[0].id).toEqual('tag_foo');
    expect(fulfillmenttoolsOrder.tags?.[0].value).toEqual(commercetoolsOrder.custom?.fields['foo']);
    expect(fulfillmenttoolsOrder.tags?.[1].id).toEqual('tag_bar');
    expect(fulfillmenttoolsOrder.tags?.[1].value).toEqual(commercetoolsOrder.custom?.fields['bar']);
  });

  it('maps preselected facilities if a store is defined', async () => {
    const commercetoolsOrder = getTestOrderWithStore();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    const preselectedFacilities = fulfillmenttoolsOrder.deliveryPreferences?.shipping?.preselectedFacilities;
    expect(preselectedFacilities).toBeDefined();
    expect(preselectedFacilities).toHaveLength(2);
    expect(preselectedFacilities?.[0].facilityRef).toEqual('store_cologne_fft_id');
    expect(preselectedFacilities?.[1].facilityRef).toEqual('store_hamburg_fft_id');
    expect(fulfillmenttoolsOrder.tags?.[0].id).toEqual('tag_store');
    expect(fulfillmenttoolsOrder.tags?.[0].value).toEqual(commercetoolsOrder.store?.key);
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

  it('maps billing address as INVOICEADDRESS', async () => {
    const order = getTestOrderWithBillingAddress();
    const mapped = await orderMapper.mapOrder(order);
    expect(mapped.consumer.addresses).toHaveLength(2);
    const billing = mapped.consumer.addresses.find((a) => a.addressType === AddressType.INVOICEADDRESS);
    expect(billing).toBeDefined();
    expect(billing?.city).toEqual('Munich');
  });

  it('maps address fields email, state, mobile, and phone', async () => {
    const order = getTestOrderWithFullAddress();
    const mapped = await orderMapper.mapOrder(order);
    const addr = mapped.consumer.addresses[0];
    expect(addr.email).toEqual('addr@example.com');
    expect(addr.province).toEqual('Bavaria');
    expect(addr.phoneNumbers).toHaveLength(2);
    expect(addr.phoneNumbers?.[0].type).toEqual(AddressPhoneNumbers.TypeEnum.MOBILE);
    expect(addr.phoneNumbers?.[1].type).toEqual(AddressPhoneNumbers.TypeEnum.PHONE);
  });

  it('maps line item attributes of various types and filters empty/scannableCodes', async () => {
    const order = getTestOrderWithAttributes();
    const mapped = await orderMapper.mapOrder(order);
    const attrs = mapped.orderLineItems[0].article.attributes ?? [];
    expect(attrs.find((a) => a.key === 'stringAttr')?.value).toEqual('hello');
    expect(attrs.find((a) => a.key === 'numAttr')?.value).toEqual('42');
    expect(attrs.find((a) => a.key === 'boolAttr')?.value).toEqual('true');
    expect(attrs.find((a) => a.key === 'labelAttr')?.value).toEqual('my label');
    expect(attrs.find((a) => a.key === 'scannableCodes')).toBeUndefined();
    expect(attrs.find((a) => a.key === 'emptyAttr')).toBeUndefined();
    expect(attrs.find((a) => a.key === 'nullAttr')).toBeUndefined();
    expect(attrs.find((a) => a.key === 'bigintAttr')).toBeUndefined();
  });

  it('falls back to plain shipping for a mapped service type that is neither SHIPPING nor CLICK_AND_COLLECT', async () => {
    server.use(
      http.get(ctApi(`/custom-objects/${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`), () =>
        HttpResponse.json(
          mockCustomObject({
            value: {
              orderCustomTypeKey: CUSTOM_TYPE_NAME,
              shippingMethodMapping: { unknown_method: { serviceType: 'SOME_OTHER_TYPE' } },
            },
          })
        )
      )
    );
    const commercetoolsOrder = getTestOrderUnknownServiceType();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.deliveryPreferences?.collect).toBeUndefined();
    expect(fulfillmenttoolsOrder.deliveryPreferences?.shipping?.preselectedFacilities).toEqual([]);
  });

  it('maps click and collect via line item channel when no collect channel reference field is configured', async () => {
    server.use(
      http.get(ctApi(`/custom-objects/${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`), () =>
        HttpResponse.json(
          mockCustomObject({
            value: {
              orderCustomTypeKey: CUSTOM_TYPE_NAME,
              shippingMethodMapping: { cc: { serviceType: ServiceType.CLICK_AND_COLLECT } },
            },
          })
        )
      )
    );
    const commercetoolsOrder = getTestOrderClickAndCollect();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.deliveryPreferences?.collect?.[0].facilityRef).toEqual('store_cologne_fft_id');
  });
});
