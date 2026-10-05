import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { OrderMapper } from '../src/order/orderMapper';
import {
  getTestOrder,
  getTestOrderClickAndCollect,
  getTestOrderClickAndCollectNoChannels,
  getTestOrderClickAndCollectWithCustomField,
  getTestOrderClickAndCollectWithMultipleChannels,
  getTestOrderWithCustomField,
  getTestOrderWithDHL,
  getTestOrderWithoutOrderNumber,
  getTestOrderWithStore,
  getTestOrderWithLongCustomField,
  getTestOrderWithUnmappableCustomField,
  getTestOrderWithoutLineItems,
  getTestOrderWithOnlyCustomLineItems,
} from '../src/order/testModels';
import { FftFacilityService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { StoreService } from 'shared';
import { server } from 'shared';
import { getTestClient } from 'shared';
import { AmbiguousChannelError, EmptyOrderError } from 'shared';

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

  it('skips custom fields that cannot be a tag value instead of breaking the order', async () => {
    const commercetoolsOrder = getTestOrderWithUnmappableCustomField();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    // 'foo' is an object, TagReference.value is a string - fft would answer 400 for the whole order
    expect(fulfillmenttoolsOrder.tags).toEqual([{ id: 'tag_bar', value: '9' }]);
  });

  it('keeps long custom field values, the fft API defines no maximum for a tag value', async () => {
    const commercetoolsOrder = getTestOrderWithLongCustomField();
    const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
    expect(fulfillmenttoolsOrder.tags).toEqual([
      { id: 'tag_foo', value: 'x'.repeat(1200) },
      { id: 'tag_bar', value: 'baz' },
    ]);
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

  it('names customLineItems as the cause when the order carries its items that way', async () => {
    const commercetoolsOrder = getTestOrderWithOnlyCustomLineItems();
    await expect(orderMapper.mapOrder(commercetoolsOrder)).rejects.toThrow(EmptyOrderError);
    await expect(orderMapper.mapOrder(commercetoolsOrder)).rejects.toThrow(
      /carries its 1 item\(s\) as customLineItems, which this connector does not map/
    );
  });

  it('says so plainly when the order has no items at all', async () => {
    const commercetoolsOrder = getTestOrderWithoutLineItems();
    await expect(orderMapper.mapOrder(commercetoolsOrder)).rejects.toThrow(/has neither lineItems nor customLineItems/);
  });
});

describe('OrderMapper address mapping', () => {
  const orderMapper = new OrderMapper(new StoreService(), new FftFacilityService(getTestClient()));

  it('maps the billing address as a second, invoice-typed address', async () => {
    const commercetoolsOrder = {
      ...getTestOrder(),
      billingAddress: {
        firstName: 'Erika',
        lastName: 'Musterfrau',
        streetName: 'Rechnungsweg',
        streetNumber: '7',
        postalCode: '50667',
        city: 'Köln',
        country: 'DE',
      },
    };

    const { addresses } = (await orderMapper.mapOrder(commercetoolsOrder)).consumer;

    expect(addresses).toHaveLength(2);
    expect(addresses[0].addressType).toEqual('POSTAL_ADDRESS');
    expect(addresses[1]).toEqual(
      expect.objectContaining({
        addressType: 'INVOICE_ADDRESS',
        firstName: 'Erika',
        street: 'Rechnungsweg',
        houseNumber: '7',
        city: 'Köln',
      })
    );
  });

  it('maps mobile and landline into separate phone numbers and the state into province', async () => {
    const base = getTestOrder();
    const commercetoolsOrder = {
      ...base,
      shippingAddress: {
        ...base.shippingAddress,
        country: 'DE',
        mobile: '+49 170 1234567',
        phone: '+49 221 1234567',
        state: 'NRW',
        email: 'max.mustermann@fulfillmenttools.com',
      },
    };

    const address = (await orderMapper.mapOrder(commercetoolsOrder)).consumer.addresses[0];

    expect(address.province).toEqual('NRW');
    expect(address.email).toEqual('max.mustermann@fulfillmenttools.com');
    expect(address.phoneNumbers).toEqual([
      { value: '+49 170 1234567', type: 'MOBILE' },
      { value: '+49 221 1234567', type: 'PHONE' },
    ]);
  });

  it('omits email, province and phone numbers when commercetools has none', async () => {
    const commercetoolsOrder = {
      ...getTestOrder(),
      shippingAddress: { country: 'DE', city: 'Köln', postalCode: '50667', streetName: 'Hauptstr' },
    };

    const address = (await orderMapper.mapOrder(commercetoolsOrder)).consumer.addresses[0];

    expect(address.email).toBeUndefined();
    expect(address.province).toBeUndefined();
    expect(address.phoneNumbers).toBeUndefined();
  });

  it('treats a blank email or state as absent', async () => {
    const base = getTestOrder();
    const commercetoolsOrder = {
      ...base,
      shippingAddress: { ...base.shippingAddress, country: 'DE', email: '   ', state: '' },
    };

    const address = (await orderMapper.mapOrder(commercetoolsOrder)).consumer.addresses[0];

    expect(address.email).toBeUndefined();
    expect(address.province).toBeUndefined();
  });
});

describe('OrderMapper article attribute mapping', () => {
  const orderMapper = new OrderMapper(new StoreService(), new FftFacilityService(getTestClient()));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function attributesFor(attributes: { name: string; value: any }[]) {
    const base = getTestOrder();
    const order = {
      ...base,
      lineItems: [{ ...base.lineItems[0], variant: { ...base.lineItems[0].variant, attributes } }],
    };
    return (await orderMapper.mapOrder(order)).orderLineItems[0].article.attributes;
  }

  it('stringifies scalar values and categorises them as miscellaneous', async () => {
    expect(
      await attributesFor([
        { name: 'ean', value: '4064721598983' },
        { name: 'onlineOnly', value: false },
        { name: 'ringSize', value: 50 },
      ])
    ).toEqual([
      { key: 'ean', value: '4064721598983', category: 'miscellaneous' },
      { key: 'onlineOnly', value: 'false', category: 'miscellaneous' },
      { key: 'ringSize', value: '50', category: 'miscellaneous' },
    ]);
  });

  it('picks a localized value, preferring English over German', async () => {
    expect(await attributesFor([{ name: 'colour', value: { 'de-DE': 'weißgold', 'en-US': 'white gold' } }])).toEqual([
      { key: 'colour', value: 'white gold', category: 'miscellaneous' },
    ]);
  });

  it('falls back to German when no English locale is present', async () => {
    expect(await attributesFor([{ name: 'colour', value: { 'de-DE': 'weißgold' } }])).toEqual([
      { key: 'colour', value: 'weißgold', category: 'miscellaneous' },
    ]);
  });

  it('unwraps the localized label of an enum-like value', async () => {
    expect(
      await attributesFor([{ name: 'availability', value: { key: 'OFFLINE', label: { 'de-DE': 'Nicht sichtbar' } } }])
    ).toEqual([{ key: 'availability', value: 'Nicht sichtbar', category: 'miscellaneous' }]);
  });

  it('drops values that cannot be rendered, the fft API rejects empty attribute values', async () => {
    expect(
      await attributesFor([
        // a money field, a reference and an empty list - none of them has a sensible string form
        { name: 'strikePrice', value: { type: 'centPrecision', currencyCode: 'EUR', centAmount: 219900 } },
        { name: 'details', value: { typeId: 'key-value-document', id: 'abc' } },
        { name: 'summary', value: [] },
        { name: 'missing', value: null },
        { name: 'keep', value: 'kept' },
      ])
    ).toEqual([{ key: 'keep', value: 'kept', category: 'miscellaneous' }]);
  });

  it('never forwards scannableCodes as an attribute', async () => {
    expect(
      await attributesFor([
        { name: 'scannableCodes', value: '4064721598983' },
        { name: 'ean', value: '4064721598983' },
      ])
    ).toEqual([{ key: 'ean', value: '4064721598983', category: 'miscellaneous' }]);
  });
});
