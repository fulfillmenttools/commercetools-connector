import { getCommercetoolsOrderById, isHttpError, logger, ResourceLockedError, CustomError } from 'shared';
import { OrderMapper } from './orderMapper';
import { FftOrderService, OrderStatus } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { isBefore, subSeconds } from 'date-fns';

export class OrderProcessor {
  private orderLock: Map<string, Date> = new Map<string, Date>();

  constructor(
    private readonly fftOrderService: FftOrderService,
    private readonly orderMapper: OrderMapper
  ) {}

  async processOrder(orderId: string, orderNumber?: string) {
    this.removeOldLocks(60);
    this.lockOrder(orderId);
    try {
      let fftOrder = undefined;
      try {
        fftOrder = await this.fftOrderService.findByTenantOrderId(orderNumber || orderId);
      } catch (e) {
        logger.error(`Cannot load order: ${JSON.stringify(e)}`);
        throw new CustomError(500, `Cannot load order with orderId ${orderNumber || orderId} from fulfillmenttools`);
      }
      if (fftOrder) {
        logger.info(`fulfillmenttools order for CT order '${orderId}' already exists => skip`);
        return;
      }
      const commercetoolsOrder = await getCommercetoolsOrderById(orderId);
      if (commercetoolsOrder.orderState === 'Cancelled') {
        logger.info(`CT order '${orderId}' is already cancelled => skip`);
        return;
      }
      const fulfillmenttoolsOrder = await this.orderMapper.mapOrder(commercetoolsOrder);
      try {
        await this.fftOrderService.create(fulfillmenttoolsOrder);
      } catch (e) {
        logger.error(`Mapped order: ${JSON.stringify(fulfillmenttoolsOrder)}`, e);
        throw new CustomError(500, `Cannot create mappedOrder in fulfillmenttools`);
      }
    } finally {
      this.unlockOrder(orderId);
    }
  }

  async cancelOrder(orderId: string, orderNumber?: string) {
    this.removeOldLocks(60);
    this.lockOrder(orderId);
    try {
      const fftOrder = await this.fftOrderService.findByTenantOrderId(orderNumber || orderId);
      if (!fftOrder) {
        logger.info(`fulfillmenttools order for CT order '${orderId}' does not exist => nothing to cancel`);
        return;
      } else if (fftOrder.status === OrderStatus.CANCELLED) {
        logger.info(
          `fulfillmenttools order '${fftOrder.id}' for CT order '${orderId}' already cancelled => nothing to do`
        );
        return;
      }
      await this.fftOrderService.cancel(fftOrder.id, fftOrder.version);
    } catch (err) {
      if (isHttpError(err)) {
        if (err.status === 400) {
          logger.info(`Not possible to cancel fulfillmenttools order for CT order '${orderId}'`);
        } else if (err.status === 404) {
          logger.info(`fulfillmenttools order for CT order '${orderId}' does not exist => nothing to cancel`);
        } else {
          logger.warn(`Could not cancel fulfillmenttools order for CT order '${orderId}'`, err.message);
          throw err;
        }
      } else {
        logger.error(`Error when cancelling fulfillmenttools order for CT order '${orderId}'`, err);
        throw err;
      }
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
