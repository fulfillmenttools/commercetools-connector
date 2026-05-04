import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Order as CTOrder, OrderUpdate } from '@commercetools/platform-sdk';
import type { Order as FftOrder } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

jest.mock('shared', () => {
  const actual = jest.requireActual('shared') as Record<string, unknown>;
  return {
    ...actual,
    getCommercetoolsOrderById: jest.fn(),
    getCustomOrderType: jest.fn(),
    createCustomOrderType: jest.fn(),
    updateCustomOrderType: jest.fn(),
    getCustomTypeOfOrder: jest.fn(),
    orderCustomTypeKey: jest.fn(),
    updateCommercetoolsOrder: jest.fn(),
  };
});

import * as shared from 'shared';
import { canUpdateOrder, OrderService } from '../src/services/orderService';

const mockCTOrder = { id: 'ct-order-id', version: 1 } as unknown as CTOrder;
const mockFFTOrder = {
  id: 'fft-order-id',
  customAttributes: { commercetoolsId: 'ct-order-id' },
} as unknown as FftOrder;

describe('OrderService.orderCreated', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
    jest.mocked(shared.getCommercetoolsOrderById).mockResolvedValue(mockCTOrder);
    jest.mocked(shared.getCustomOrderType).mockResolvedValue('existing-type-id');
    jest.mocked(shared.updateCustomOrderType).mockResolvedValue(undefined);
    jest.mocked(shared.updateCommercetoolsOrder).mockResolvedValue(mockCTOrder);
  });

  it('ignores an FFT order that has no commercetoolsId', async () => {
    await service.orderCreated({ id: 'fft-1' } as unknown as FftOrder);
    expect(shared.getCommercetoolsOrderById).not.toHaveBeenCalled();
  });

  it('calls createCustomOrderType when no custom order type exists yet', async () => {
    jest.mocked(shared.getCustomOrderType).mockResolvedValue(undefined);
    jest.mocked(shared.createCustomOrderType).mockResolvedValue(undefined);
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue(undefined);
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue(undefined);

    await service.orderCreated(mockFFTOrder);

    expect(shared.createCustomOrderType).toHaveBeenCalled();
    expect(shared.updateCustomOrderType).not.toHaveBeenCalled();
  });

  it('sets custom type when the CT order has no custom type but a key is configured', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue(undefined);
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue('fftOrderType');

    await service.orderCreated(mockFFTOrder);

    expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
    const update = jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0]![1] as OrderUpdate;
    expect(update.actions[0]!.action).toBe('setCustomType');
  });

  it('sets a custom field when the CT order custom type already matches', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue('fftOrderType');
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue('fftOrderType');

    await service.orderCreated(mockFFTOrder);

    expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
    const update = jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0]![1] as OrderUpdate;
    expect(update.actions[0]!.action).toBe('setCustomField');
  });

  it('skips the update when the CT order has an unsupported custom type', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue('some-other-type');
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue('fftOrderType');

    await service.orderCreated(mockFFTOrder);

    expect(shared.updateCommercetoolsOrder).not.toHaveBeenCalled();
  });

  it('skips the update when no custom type key is configured', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue('fftOrderType');
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue(undefined);

    await service.orderCreated(mockFFTOrder);

    expect(shared.updateCommercetoolsOrder).not.toHaveBeenCalled();
  });
});

describe('canUpdateOrder', () => {
  it('returns true when the order custom type matches the configured key', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue('fftOrderType');
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue('fftOrderType');

    expect(await canUpdateOrder(mockCTOrder)).toBe(true);
  });

  it('returns false when no custom type key is configured', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue('fftOrderType');
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue(undefined);

    expect(await canUpdateOrder(mockCTOrder)).toBe(false);
  });

  it('returns false when the order custom type does not match the configured key', async () => {
    jest.mocked(shared.getCustomTypeOfOrder).mockReturnValue('some-other-type');
    jest.mocked(shared.orderCustomTypeKey).mockResolvedValue('fftOrderType');

    expect(await canUpdateOrder(mockCTOrder)).toBe(false);
  });
});
