import {
  Address,
  BusinessUnitKeyReference,
  CartDiscountReference,
  CartOrigin,
  CartReference,
  CentPrecisionMoney,
  Order as CommercetoolsOrder,
  CreatedBy,
  CustomerGroupReference,
  CustomFields,
  CustomLineItem,
  DiscountCodeInfo,
  InventoryMode,
  LastModifiedBy,
  LineItem,
  OrderState,
  PaymentInfo,
  PaymentState,
  QuoteReference,
  ReturnInfo,
  RoundingMode,
  ShipmentState,
  Shipping,
  ShippingInfo,
  ShippingMethod,
  ShippingMode,
  ShippingRateInput,
  StateReference,
  StoreKeyReference,
  SyncInfo,
  TaxCalculationMode,
  TaxedPrice,
  TaxMode,
} from '@commercetools/platform-sdk';
import { CUSTOM_TYPE_NAME } from 'shared';

const shippingMethodDHL: ShippingMethod = {
  createdAt: '',
  id: '',
  isDefault: false,
  lastModifiedAt: '',
  name: 'DHL',
  taxCategory: {
    typeId: 'tax-category',
    id: '123',
  },
  version: 0,
  zoneRates: [],
  key: 'dhl',
  active: true,
};

const shippingMethodClickAndCollect: ShippingMethod = {
  createdAt: '',
  id: '',
  isDefault: false,
  lastModifiedAt: '',
  name: 'Click and Collect',
  taxCategory: {
    typeId: 'tax-category',
    id: '123',
  },
  version: 0,
  zoneRates: [],
  key: 'cc',
  active: true,
};

const price1: CentPrecisionMoney = { type: 'centPrecision', centAmount: 600, currencyCode: 'EUR', fractionDigits: 0 };
const price2: CentPrecisionMoney = { type: 'centPrecision', centAmount: 0, currencyCode: 'EUR', fractionDigits: 0 };

const shippingInfoDHL: ShippingInfo = {
  price: price1,
  shippingMethod: {
    typeId: 'shipping-method',
    id: '123',
    obj: shippingMethodDHL,
  },
  shippingMethodName: 'Default',
  shippingMethodState: '',
  shippingRate: {
    price: price1,
    tiers: [],
  },
};

const shippingInfoClickAndCollect: ShippingInfo = {
  shippingMethodName: 'Click And Collect',
  price: price2,
  shippingMethod: {
    typeId: 'shipping-method',
    id: '123',
    obj: shippingMethodClickAndCollect,
  },
  shippingMethodState: '',
  shippingRate: {
    price: price2,
    tiers: [],
  },
};

function lineItemWithSupplyChannel(channelKey: string, channelId: string) {
  const lineItemWithSupplyChannel: LineItem = {
    discountedPricePerQuantity: [],
    id: '',
    lineItemMode: 'Standard',
    name: { en: 'Cigköfte Wrap' },
    perMethodTaxRate: [],
    price: { id: '12345', value: { centAmount: 1000, currencyCode: 'eur', type: 'centPrecision', fractionDigits: 1 } },
    priceMode: 'ExternalPrice',
    productId: 'tenantArticleId',
    productType: { typeId: 'product-type', id: '123456789' },
    quantity: 1,
    state: [],
    taxedPricePortions: [],
    totalPrice: { centAmount: 1000, currencyCode: 'eur', type: 'centPrecision', fractionDigits: 1 },
    variant: { id: 0, images: [{ url: 'https://fancy-image.example.com', dimensions: { w: 100, h: 100 } }] },
    supplyChannel: {
      typeId: 'channel',
      id: channelId,
      obj: { key: channelKey, id: channelId, version: 1, createdAt: '', lastModifiedAt: '', roles: [] },
    },
  };
  return lineItemWithSupplyChannel;
}

const lineItem: LineItem = {
  discountedPricePerQuantity: [],
  id: '',
  lineItemMode: 'Standard',
  name: { en: 'Cigköfte Wrap' },
  perMethodTaxRate: [],
  price: { id: '12345', value: { centAmount: 1000, currencyCode: 'eur', type: 'centPrecision', fractionDigits: 1 } },
  priceMode: 'ExternalPrice',
  productId: 'tenantArticleId',
  productType: { typeId: 'product-type', id: '123456789' },
  quantity: 1,
  state: [],
  taxedPricePortions: [],
  totalPrice: { centAmount: 1000, currencyCode: 'eur', type: 'centPrecision', fractionDigits: 1 },
  variant: { id: 0, images: [{ url: 'https://fancy-image.example.com', dimensions: { w: 100, h: 100 } }] },
};

const shippingAddress: Address = {
  additionalAddressInfo: 'second floor',
  additionalStreetInfo: '',
  apartment: '',
  building: '',
  city: 'Köln',
  company: 'Fulfillmenttools',
  country: 'DE',
  custom: undefined,
  department: '',
  email: '',
  externalId: '',
  fax: '',
  firstName: 'Max',
  id: '',
  key: '',
  lastName: 'Mustermann',
  mobile: '',
  pOBox: '',
  phone: '',
  postalCode: '51063',
  region: '',
  salutation: '',
  state: '',
  streetName: 'Schanzenstraße',
  streetNumber: '30',
  title: '',
};

const commercetoolsOrderTemplate: CommercetoolsOrderTemplate = {
  customLineItems: [],
  createdAt: '2023-04-27T14:31:52.004Z',
  id: 'orderId',
  orderNumber: 'orderNumber',
  lastModifiedAt: '',
  lineItems: [lineItem],
  shippingAddress: shippingAddress,
  orderState: 'Confirmed',
  origin: 'Merchant Center',
  refusedGifts: [],
  shipping: [],
  shippingMode: 'shippingMode',
  syncInfo: [],
  totalPrice: { centAmount: 1000, currencyCode: 'eur', type: 'centPrecision', fractionDigits: 1 },
  version: 0,
  customerEmail: 'max.mustermann@fulfillmenttools.com',
};

export function getTestOrder() {
  return mapTemplateToOrder(commercetoolsOrderTemplate);
}

export function getTestOrderWithoutOrderNumber() {
  const template = commercetoolsOrderTemplate;
  template.orderNumber = undefined;
  return mapTemplateToOrder(template);
}

export function getTestOrderWithDHL() {
  const template = commercetoolsOrderTemplate;
  template.shippingInfo = shippingInfoDHL;
  return mapTemplateToOrder(template);
}

export function getTestOrderClickAndCollect() {
  const template = commercetoolsOrderTemplate;
  template.shippingInfo = shippingInfoClickAndCollect;
  template.lineItems = [
    lineItemWithSupplyChannel('store_cologne', '123'),
    lineItemWithSupplyChannel('store_cologne', '123'),
  ];
  return mapTemplateToOrder(template);
}

export function getTestOrderClickAndCollectWithMultipleChannels() {
  const template = commercetoolsOrderTemplate;
  template.shippingInfo = shippingInfoClickAndCollect;
  template.lineItems = [
    lineItemWithSupplyChannel('store_cologne', '123'),
    lineItemWithSupplyChannel('store_hamburg', '321'),
  ];
  return mapTemplateToOrder(template);
}

export function getTestOrderClickAndCollectNoChannels() {
  const template = commercetoolsOrderTemplate;
  template.shippingInfo = shippingInfoClickAndCollect;
  template.lineItems = [lineItem, lineItem];
  return mapTemplateToOrder(template);
}

export function getTestOrderClickAndCollectWithCustomField() {
  const template = commercetoolsOrderTemplate;
  template.shippingInfo = shippingInfoClickAndCollect;
  template.custom = {
    type: { id: CUSTOM_TYPE_NAME, typeId: 'type' },
    fields: { fft_supply_channel_for_click_and_collect: 'store_hamburg' },
  };
  return mapTemplateToOrder(template);
}

export function getTestOrderWithCustomField() {
  const template = commercetoolsOrderTemplate;
  template.custom = {
    type: { id: CUSTOM_TYPE_NAME, typeId: 'type' },
    fields: { foo: 'urgent', bar: '12345' },
  };
  return mapTemplateToOrder(template);
}

export function getTestOrderWithStore() {
  const template = commercetoolsOrderTemplate;
  template.store = { typeId: 'store', key: 'store_01' };
  return mapTemplateToOrder(template);
}

function mapTemplateToOrder(template: CommercetoolsOrderTemplate): CommercetoolsOrder {
  return {
    anonymousId: template.anonymousId,
    billingAddress: template.billingAddress,
    businessUnit: template.businessUnit,
    cart: template.cart,
    completedAt: template.completedAt,
    country: template.country,
    createdAt: template.createdAt,
    createdBy: template.createdBy,
    custom: template.custom,
    customLineItems: template.customLineItems,
    customerEmail: template.customerEmail,
    customerGroup: template.customerGroup,
    customerId: template.customerId,
    discountCodes: template.discountCodes,
    id: template.id,
    inventoryMode: template.inventoryMode,
    itemShippingAddresses: template.itemShippingAddresses,
    lastMessageSequenceNumber: template.lastMessageSequenceNumber,
    lastModifiedAt: template.lastModifiedAt,
    lastModifiedBy: template.lastModifiedBy,
    lineItems: template.lineItems,
    locale: template.locale,
    orderNumber: template.orderNumber,
    orderState: template.orderState,
    origin: template.origin,
    paymentInfo: template.paymentInfo,
    paymentState: template.paymentState,
    purchaseOrderNumber: template.purchaseOrderNumber,
    quote: template.quote,
    refusedGifts: template.refusedGifts,
    returnInfo: template.returnInfo,
    shipmentState: template.shipmentState,
    shipping: template.shipping,
    shippingAddress: template.shippingAddress,
    shippingInfo: template.shippingInfo,
    shippingMode: template.shippingMode,
    shippingRateInput: template.shippingRateInput,
    state: template.state,
    store: template.store,
    syncInfo: template.syncInfo,
    taxCalculationMode: template.taxCalculationMode,
    taxMode: template.taxMode,
    taxRoundingMode: template.taxRoundingMode,
    taxedPrice: template.taxedPrice,
    taxedShippingPrice: template.taxedShippingPrice,
    totalPrice: template.totalPrice,
    version: template.version,
  };
}

// Redefined ct order to have the ability to modify
// fields as they are readonly in the original interface
interface CommercetoolsOrderTemplate {
  id: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy?: LastModifiedBy;
  createdBy?: CreatedBy;
  completedAt?: string;
  orderNumber?: string;
  customerId?: string;
  customerEmail?: string;
  anonymousId?: string;
  businessUnit?: BusinessUnitKeyReference;
  store?: StoreKeyReference;
  lineItems: LineItem[];
  customLineItems: CustomLineItem[];
  totalPrice: CentPrecisionMoney;
  taxedPrice?: TaxedPrice;
  taxedShippingPrice?: TaxedPrice;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMode: ShippingMode;
  shipping: Shipping[];
  taxMode?: TaxMode;
  taxRoundingMode?: RoundingMode;
  customerGroup?: CustomerGroupReference;
  country?: string;
  orderState: OrderState;
  state?: StateReference;
  shipmentState?: ShipmentState;
  paymentState?: PaymentState;
  shippingInfo?: ShippingInfo;
  syncInfo: SyncInfo[];
  returnInfo?: ReturnInfo[];
  purchaseOrderNumber?: string;
  discountCodes?: DiscountCodeInfo[];
  lastMessageSequenceNumber?: number;
  cart?: CartReference;
  quote?: QuoteReference;
  custom?: CustomFields;
  paymentInfo?: PaymentInfo;
  locale?: string;
  inventoryMode?: InventoryMode;
  origin: CartOrigin;
  taxCalculationMode?: TaxCalculationMode;
  shippingRateInput?: ShippingRateInput;
  itemShippingAddresses?: Address[];
  refusedGifts: CartDiscountReference[];
}
