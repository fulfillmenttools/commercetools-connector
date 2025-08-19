import { CUSTOM_TYPE_NAME } from 'shared';
import { OrderRest } from '@commercetools/composable-commerce-test-data/order';
import { Address as AddressRest, MoneyRest, PriceRest } from '@commercetools/composable-commerce-test-data/commons';
import { LineItemRest, ShippingInfoRest } from '@commercetools/composable-commerce-test-data/cart';
import {
  ShippingMethod as ShippingMethodRest,
  ShippingRate as ShippingRateRest,
} from '@commercetools/composable-commerce-test-data/shipping-method';
import { TaxCategory as TaxCategoryRest } from '@commercetools/composable-commerce-test-data/tax-category';
import { ProductTypeRest } from '@commercetools/composable-commerce-test-data/product-type';
import {
  ImageDimensionsRest,
  ImageRest,
  ProductVariantRest,
} from '@commercetools/composable-commerce-test-data/product';
import { ChannelRest } from '@commercetools/composable-commerce-test-data/channel';
import { CustomFieldsRest } from '@commercetools/composable-commerce-test-data/custom-fields';
import { StoreRest } from '@commercetools/composable-commerce-test-data/store';
import { Channel, LineItem, Order, ShippingMethod } from '@commercetools/platform-sdk';

const shippingMethodDHL = ShippingMethodRest.random()
  .isDefault(false)
  .name('DHL')
  .taxCategory(TaxCategoryRest.random().id('123'))
  .key('dhl')
  .active(true);

const shippingMethodClickAndCollect = ShippingMethodRest.random()
  .isDefault(false)
  .name('Click and Collect')
  .taxCategory(TaxCategoryRest.random().id('123'))
  .key('cc');

const shippingInfoDHL = ShippingInfoRest.random()
  .price(PriceRest.random().value(MoneyRest.random().centAmount(600).currencyCode('EUR')))
  .shippingMethod(shippingMethodDHL)
  .shippingRate(
    ShippingRateRest.random().price(PriceRest.random().value(MoneyRest.random().centAmount(600).currencyCode('EUR')))
  );

const shippingInfoClickAndCollect = ShippingInfoRest.random()
  .shippingMethodName('Click And Collect')
  .price(PriceRest.random().value(MoneyRest.random().centAmount(0).currencyCode('EUR')))
  .shippingMethod(shippingMethodClickAndCollect)
  .shippingMethodState('')
  .shippingRate(
    ShippingRateRest.random().price(PriceRest.random().value(MoneyRest.random().centAmount(0).currencyCode('EUR')))
  );

const getRandomLineItem = () => {
  return LineItemRest.random()
    .lineItemMode('Standard')
    .name({ en: 'Cigköfte Wrap' })
    .priceMode('ExternalPrice')
    .productId('tenantArticleId')
    .price(PriceRest.random().value(MoneyRest.random().centAmount(1000).currencyCode('EUR')))
    .productType(ProductTypeRest.random().id('123456789'))
    .quantity(1)
    .totalPrice(PriceRest.random().value(MoneyRest.random().centAmount(1000).currencyCode('EUR')))
    .variant(
      ProductVariantRest.random()
        .id(0)
        .sku(undefined)
        .images([
          ImageRest.random()
            .url('https://fancy-image.example.com')
            .dimensions(ImageDimensionsRest.random().w(100).h(100)),
        ])
    );
};

function lineItemWithSupplyChannel(channelKey: string, channelId: string) {
  return getRandomLineItem().supplyChannel(ChannelRest.random().key(channelKey).id(channelId));
}

const commercetoolsOrderTemplate = OrderRest.random()
  .id('orderId')
  .createdAt('2023-04-27T14:31:52.004Z')
  .orderNumber('orderNumber')
  .customLineItems([])
  .orderState('Confirmed')
  .origin('Merchant Center')
  .shippingMode('Single')
  .totalPrice(PriceRest.random().value(MoneyRest.random().centAmount(1000).currencyCode('EUR')))
  .customerEmail('max.mustermann@fulfillmenttools.com')
  .shippingInfo(undefined)
  .billingAddress(undefined)
  .shippingAddress(
    AddressRest.random()
      .additionalAddressInfo('second floor')
      .city('Köln')
      .company('Fulfillmenttools')
      .country('DE')
      .firstName('Max')
      .lastName('Mustermann')
      .postalCode('51063')
      .streetName('Schanzenstraße')
      .streetNumber('30')
  )
  .lineItems([getRandomLineItem()]);

export function getTestOrder() {
  return commercetoolsOrderTemplate.buildRest();
}

export function getTestOrderWithoutOrderNumber() {
  return commercetoolsOrderTemplate.orderNumber(undefined).buildRest();
}

//Sad but true, but the library to generate test object does not handle reference well at the moment
function patchOrder(order: Order): Order {
  const shippingInfo = order.shippingInfo;
  const result: Order = {
    ...order,
    lineItems: order.lineItems.map((lineItem): LineItem => {
      if (lineItem.supplyChannel) {
        return {
          ...lineItem,
          supplyChannel: {
            typeId: 'channel',
            id: lineItem.supplyChannel.id,
            obj: (lineItem.supplyChannel || {}) as any as Channel,
          },
        };
      }
      return { ...lineItem };
    }),
  };
  if (shippingInfo) {
    return {
      ...result,
      shippingInfo: {
        ...shippingInfo,
        shippingMethod: {
          typeId: 'shipping-method',
          id: shippingInfo?.shippingMethod?.id || '',
          obj: (shippingInfo?.shippingMethod || {}) as ShippingMethod,
        },
      },
    };
  }
  return result;
}

export function getTestOrderWithDHL() {
  return patchOrder(commercetoolsOrderTemplate.shippingInfo(shippingInfoDHL).buildRest());
}

export function getTestOrderClickAndCollect() {
  return patchOrder(
    commercetoolsOrderTemplate
      .shippingInfo(shippingInfoClickAndCollect)
      .lineItems([lineItemWithSupplyChannel('store_cologne', '123'), lineItemWithSupplyChannel('store_cologne', '123')])
      .buildRest()
  );
}

export function getTestOrderClickAndCollectWithMultipleChannels() {
  return patchOrder(
    commercetoolsOrderTemplate
      .shippingInfo(shippingInfoClickAndCollect)
      .lineItems([lineItemWithSupplyChannel('store_cologne', '123'), lineItemWithSupplyChannel('store_hamburg', '321')])
      .buildRest()
  );
}

export function getTestOrderClickAndCollectNoChannels() {
  return patchOrder(
    commercetoolsOrderTemplate
      .shippingInfo(shippingInfoClickAndCollect)
      .lineItems([getRandomLineItem(), getRandomLineItem()])
      .buildRest()
  );
}

export function getTestOrderClickAndCollectWithCustomField() {
  return patchOrder(
    commercetoolsOrderTemplate
      .shippingInfo(shippingInfoClickAndCollect)
      .custom(
        CustomFieldsRest.random()
          .type({ id: CUSTOM_TYPE_NAME, typeId: 'type' })
          .fields({ fft_supply_channel_for_click_and_collect: 'store_hamburg' })
      )
      .buildRest()
  );
}

export function getTestOrderWithCustomField() {
  return commercetoolsOrderTemplate
    .custom(
      CustomFieldsRest.random().type({ id: CUSTOM_TYPE_NAME, typeId: 'type' }).fields({ foo: 'urgent', bar: '12345' })
    )
    .buildRest();
}

export function getTestOrderWithStore() {
  return commercetoolsOrderTemplate.store(StoreRest.random().key('store_01')).buildRest();
}
