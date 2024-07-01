import { Router } from 'express';

import {
  FftApiClient,
  FftFacilityService,
  FftListingService,
  FftOrderService,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { asyncHandler, StoreService as CommercetoolsStoreService } from 'shared';
import { ChannelProcessor } from '../channel/channelProcessor';
import { ChannelService } from '../services/channelService';
import { EventController } from '../controllers/eventController';
import { StatusController } from '../controllers/statusController';
import { OrderMapper } from '../order/orderMapper';
import { OrderProcessor } from '../order/orderProcessor';
import { ProductProcessor } from '../product/productProcessor';
import { ProductMapper } from '../product/productMapper';

export class EventRouter {
  private eventRouter = Router();

  constructor(fftApiClient: FftApiClient) {
    const orderService = new FftOrderService(fftApiClient);
    const facilityService = new FftFacilityService(fftApiClient);
    const listingService = new FftListingService(fftApiClient);
    const channelService = new ChannelService(facilityService);
    const ctStoreService = new CommercetoolsStoreService();
    const orderProcessor = new OrderProcessor(orderService, new OrderMapper(ctStoreService, facilityService));
    const channelProcessor = new ChannelProcessor(channelService);
    const productProcessor = new ProductProcessor(facilityService, listingService, new ProductMapper(facilityService));

    const statusController = new StatusController();
    const eventController = new EventController(orderProcessor, productProcessor, channelProcessor);

    this.eventRouter.get('/status', asyncHandler(statusController.status));

    this.eventRouter.post('/', asyncHandler(eventController.post));
  }

  public getRouter(): Router {
    return this.eventRouter;
  }
}
