import { Router } from 'express';

import { EventController } from '../controllers/eventController';
import { StatusController } from '../controllers/statusController';
import { FftApiClient, FftFacilityService, FftOrderService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { OrderMapper } from '../order/orderMapper';
import { OrderProcessor } from '../order/orderProcessor';
import { StoreService as CommercetoolsStoreService } from 'shared';
import { asyncHandler } from 'shared';

export class EventRouter {
  private eventRouter = Router();

  constructor(fftApiClient: FftApiClient) {
    const orderService = new FftOrderService(fftApiClient);
    const facilityService = new FftFacilityService(fftApiClient);
    const ctStoreService = new CommercetoolsStoreService();
    const orderProcessor = new OrderProcessor(orderService, new OrderMapper(ctStoreService, facilityService));

    const statusController = new StatusController();
    const eventController = new EventController(orderProcessor);

    this.eventRouter.get('/status', asyncHandler(statusController.status));

    this.eventRouter.post('/', asyncHandler(eventController.post));
  }

  public getRouter(): Router {
    return this.eventRouter;
  }
}
