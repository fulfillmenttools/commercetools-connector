import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Order, OrderUpdate } from '@commercetools/platform-sdk';
import type {
  FftLoadUnitService,
  PickJob,
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
import { PickJobService } from '../src/services/pickJobService';

const mockCTOrder = { id: 'ct-order-id', version: 1 } as unknown as Order;

const mockPickJob = {
  id: 'pick-job-id',
  shortId: 'short-1',
  facilityRef: 'facility-ref',
  orderRef: 'fft-order-ref',
  customAttributes: { commercetoolsId: 'ct-order-id' },
} as unknown as PickJob;

describe('PickJobService', () => {
  let service: PickJobService;
  let mockLoadUnitService: { findByPickJobRef: jest.Mock<(...args: unknown[]) => Promise<unknown>> };

  beforeEach(() => {
    mockLoadUnitService = { findByPickJobRef: jest.fn() };
    service = new PickJobService(mockLoadUnitService as unknown as FftLoadUnitService);
    jest.mocked(shared.getCommercetoolsOrderById).mockResolvedValue(mockCTOrder);
    jest.mocked(shared.updateCommercetoolsOrder).mockResolvedValue(mockCTOrder);
    jest.mocked(canUpdateOrder).mockResolvedValue(true);
  });

  describe('pickJobCreated', () => {
    it('ignores a pick job with no commercetoolsId', async () => {
      await service.pickJobCreated({ id: 'pj-1', orderRef: 'order-ref' } as unknown as PickJob);
      expect(shared.getCommercetoolsOrderById).not.toHaveBeenCalled();
    });

    it('skips the update when canUpdateOrder returns false', async () => {
      jest.mocked(canUpdateOrder).mockResolvedValue(false);

      await service.pickJobCreated(mockPickJob);

      expect(shared.updateCommercetoolsOrder).not.toHaveBeenCalled();
    });

    it('updates the CT order with pickJob, shortId, and facilityRef fields', async () => {
      await service.pickJobCreated(mockPickJob);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalledWith('ct-order-id', expect.any(Object));
      const update = (jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0] as [string, OrderUpdate])[1];
      expect(update.actions).toHaveLength(3);
      expect(update.actions.map((a) => (a as { name?: string }).name)).toEqual(
        expect.arrayContaining(['fft_pickjob_id', 'fft_shortid', 'fft_facility_id'])
      );
    });
  });

  describe('pickJobFinished', () => {
    it('ignores a pick job with no commercetoolsId', async () => {
      await service.pickJobFinished({ id: 'pj-1', orderRef: 'order-ref' } as unknown as PickJob);
      expect(shared.getCommercetoolsOrderById).not.toHaveBeenCalled();
    });

    it('skips the update when canUpdateOrder returns false', async () => {
      jest.mocked(canUpdateOrder).mockResolvedValue(false);

      await service.pickJobFinished(mockPickJob);

      expect(shared.updateCommercetoolsOrder).not.toHaveBeenCalled();
    });

    it('updates the CT order with load unit count when load units are found', async () => {
      mockLoadUnitService.findByPickJobRef.mockResolvedValue([{ id: 'lu-1' }, { id: 'lu-2' }]);

      await service.pickJobFinished(mockPickJob);

      expect(shared.updateCommercetoolsOrder).toHaveBeenCalledWith('ct-order-id', expect.any(Object));
      const update = (jest.mocked(shared.updateCommercetoolsOrder).mock.calls[0] as [string, OrderUpdate])[1];
      expect((update.actions[0] as { name?: string }).name).toBe('fft_load_units_amount');
      expect((update.actions[0] as { value?: unknown }).value).toBe(2);
    });

    it('skips the update when no load units are found', async () => {
      mockLoadUnitService.findByPickJobRef.mockResolvedValue([]);

      await service.pickJobFinished(mockPickJob);

      expect(shared.updateCommercetoolsOrder).not.toHaveBeenCalled();
    });
  });
});
