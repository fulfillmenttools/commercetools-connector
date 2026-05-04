import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Order, OrderUpdate } from '@commercetools/platform-sdk';
import type {
  FftOrderService,
  FftParcelService,
  FftShipmentService,
  Handoverjob,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

jest.mock('shared', () => {
  const actual = jest.requireActual('shared') as Record<string, unknown>;
  return {
    ...actual,
    getCommercetoolsOrderById: jest.fn(),
    updateCommercetoolsOrder: jest.fn(),
  };
});

jest.mock('../src/services/orderService', () => ({
  canUpdateOrder: jest.fn(),
}));

import * as shared from 'shared';
import { canUpdateOrder } from '../src/services/orderService';
import { HandoverJobService } from '../src/services/handoverJobService';

const mockCTOrder = { id: 'ct-order-id', version: 1 } as unknown as Order;
const mockStrippedFftOrder = { id: 'fft-stripped-order-id' } as unknown as Awaited<ReturnType<FftOrderService['findByTenantOrderId']>>;
const mockFftOrder = {
  id: 'fft-order-id',
  customAttributes: { commercetoolsId: 'ct-order-id' },
} as unknown as Awaited<ReturnType<FftOrderService['findBy']>>;

const mockHandoverJob = {
  id: 'handover-job-id',
  tenantOrderId: 'tenant-order-id',
  shipmentRef: 'shipment-ref-1',
} as unknown as Handoverjob;

describe('HandoverJobService', () => {
  let service: HandoverJobService;
  let mockFftOrderService: { findByTenantOrderId: jest.Mock<(...args: unknown[]) => Promise<unknown>>; findBy: jest.Mock<(...args: unknown[]) => Promise<unknown>> };
  let mockFftShipmentService: { findById: jest.Mock<(...args: unknown[]) => Promise<unknown>> };
  let mockFftParcelService: { findMultiple: jest.Mock<(...args: unknown[]) => Promise<unknown>> };

  beforeEach(() => {
    mockFftOrderService = { findByTenantOrderId: jest.fn(), findBy: jest.fn() };
    mockFftShipmentService = { findById: jest.fn() };
    mockFftParcelService = { findMultiple: jest.fn() };
    mockFftOrderService.findByTenantOrderId.mockResolvedValue(mockStrippedFftOrder);
    mockFftOrderService.findBy.mockResolvedValue(mockFftOrder);
    service = new HandoverJobService(
      mockFftOrderService as unknown as FftOrderService,
      mockFftShipmentService as unknown as FftShipmentService,
      mockFftParcelService as unknown as FftParcelService
    );
    jest.mocked(shared.getCommercetoolsOrderById).mockResolvedValue(mockCTOrder);
    jest.mocked(shared.updateCommercetoolsOrder).mockResolvedValue(mockCTOrder);
    jest.mocked(canUpdateOrder).mockResolvedValue(true);
  });

  describe('handoverJobCreated', () => {
    it('ignores a handover job that has no tenantOrderId', async () => {
      await service.handoverJobCreated({ id: 'hj-1' } as unknown as Handoverjob);
      expect(mockFftOrderService.findByTenantOrderId).not.toHaveBeenCalled();
    });

    it('ignores when no FFT order matches the tenantOrderId', async () => {
      mockFftOrderService.findByTenantOrderId.mockResolvedValue(undefined);

      await service.handoverJobCreated(mockHandoverJob);

      expect(mockFftOrderService.findBy).not.toHaveBeenCalled();
      expect(shared.getCommercetoolsOrderById).not.toHaveBeenCalled();
    });

    it('ignores when the FFT order has no commercetoolsId', async () => {
      mockFftOrderService.findBy.mockResolvedValue({ id: 'fft-1', customAttributes: {} });

      await service.handoverJobCreated(mockHandoverJob);

      expect(shared.getCommercetoolsOrderById).not.toHaveBeenCalled();
    });

    it('updates the CT order with shipmentState=Ready', async () => {
      mockFftShipmentService.findById.mockResolvedValue({
        id: 'shipment-1',
        parcels: [{ parcelRef: 'p1' }],
      });
      mockFftParcelService.findMultiple.mockResolvedValue([
        { result: { carrierTrackingNumber: 'TRK123', trackingUrl: 'http://track' } },
      ]);

      await service.handoverJobCreated(mockHandoverJob);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
      const update = (jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0] as [string, OrderUpdate])[1];
      expect((update.actions as OrderUpdate['actions']).find((a) => a.action === 'changeShipmentState')).toMatchObject({ shipmentState: 'Ready' });
    });

    it('still updates the CT order when shipmentRef is absent (skips tracking)', async () => {
      const jobWithoutShipment = { ...mockHandoverJob, shipmentRef: undefined };

      await service.handoverJobCreated(jobWithoutShipment);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
      const update = (jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0] as [string, OrderUpdate])[1];
      expect(update.actions.some((a) => (a as { name?: string }).name === 'fft_parcels')).toBe(false);
    });

    it('still updates the CT order when the shipment has no parcels', async () => {
      mockFftShipmentService.findById.mockResolvedValue({ id: 'shipment-1', parcels: undefined });

      await service.handoverJobCreated(mockHandoverJob);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
      const update = (jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0] as [string, OrderUpdate])[1];
      expect(update.actions.some((a) => (a as { name?: string }).name === 'fft_parcels')).toBe(false);
    });

    it('still updates the CT order when fetching shipment data throws', async () => {
      mockFftShipmentService.findById.mockRejectedValue(new Error('shipment service unavailable'));

      await service.handoverJobCreated(mockHandoverJob);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
    });
  });

  describe('handoverJobHandedOver', () => {
    it('ignores a handover job that has no tenantOrderId', async () => {
      await service.handoverJobHandedOver({ id: 'hj-1' } as unknown as Handoverjob);
      expect(mockFftOrderService.findByTenantOrderId).not.toHaveBeenCalled();
    });

    it('updates the CT order with shipmentState=Shipped', async () => {
      await service.handoverJobHandedOver(mockHandoverJob);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalled();
      const update = (jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0] as [string, OrderUpdate])[1];
      expect((update.actions[0] as { action: string }).action).toBe('changeShipmentState');
      expect((update.actions[0] as { shipmentState: string }).shipmentState).toBe('Shipped');
    });
  });
});
