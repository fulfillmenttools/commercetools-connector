import { getCommercetoolsOrderById, logger, ResourceLockedError } from 'shared';
import { OrderMapper } from './orderMapper';
import { FftOrderService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { isBefore, subSeconds } from 'date-fns';

export class OrderProcessor {
  private orderLock: Map<string, Date> = new Map<string, Date>();

  constructor(private readonly fftOrderService: FftOrderService, private readonly orderMapper: OrderMapper) {}

  async processOrder(orderId: string) {
    this.removeOldLocks(60);
    this.lockOrder(orderId);
    try {
      const fftOrder = await this.fftOrderService.findByTenantOrderId(orderId);
      if (fftOrder) {
        logger.info(`fulfillmenttools order for CT order '${orderId}' already exists => skip`);
        return;
      }
      const commercetoolsOrder = await getCommercetoolsOrderById(orderId);
      const fulfillmenttoolsOrder = await this.orderMapper.mapOrder(commercetoolsOrder);
      await this.fftOrderService.create(fulfillmenttoolsOrder);
    } finally {
      this.unlockOrder(orderId);
    }
  }

  private lockOrder(orderId: string) {
    if (this.orderLock.get(orderId)) {
      throw new ResourceLockedError(`CT Order '${orderId}' is already locked`);
    }
    this.orderLock.set(orderId, new Date());
  }

  private unlockOrder(orderId: string) {
    this.orderLock.delete(orderId);
  }

  private removeOldLocks(expirationSeconds: number) {
    const now = new Date();
    this.orderLock.forEach((timeStamp, orderId) => {
      if (isBefore(timeStamp, subSeconds(now, expirationSeconds))) {
        this.orderLock.delete(orderId);
      }
    });
  }
}
