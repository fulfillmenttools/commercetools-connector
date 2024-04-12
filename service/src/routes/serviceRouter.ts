import { Router } from 'express';

import { HandoverJobController } from '../controllers/handoverJobController';
import { OrderController } from '../controllers/orderController';
import { PickJobController } from '../controllers/pickJobController';
import { StatusController } from '../controllers/statusController';
import { HandoverJobService } from '../services/handoverJobService';
import { OrderService } from '../services/orderService';
import { PickJobService } from '../services/pickJobService';
import {
  FftApiClient,
  FftLoadUnitService,
  FftOrderService,
  FftParcelService,
  FftShipmentService,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { asyncHandler, checkJwt } from 'shared';

export const fftEvents: { [index: string]: string } = {
  PICK_JOB_CREATED: '/pickjob/created',
  PICK_JOB_PICKING_FINISHED: '/pickjob/finished',
  HANDOVERJOB_CREATED: '/handoverjob/created',
  HANDOVERJOB_HANDED_OVER: '/handoverjob/handedover',
  ORDER_CREATED: '/order/created',
};

export class ServiceRouter {
  private serviceRouter = Router();

  constructor(fftApiClient: FftApiClient, enableAuth = true) {
    const fftLoadUnitService = new FftLoadUnitService(fftApiClient);
    const fftOrderService = new FftOrderService(fftApiClient);
    const fftShipmentServie = new FftShipmentService(fftApiClient);
    const fftParcelService = new FftParcelService(fftApiClient);

    const orderService = new OrderService();
    const pickJobService = new PickJobService(fftLoadUnitService);
    const handoverJobService = new HandoverJobService(fftOrderService, fftShipmentServie, fftParcelService);

    const statusController = new StatusController();
    const orderController = new OrderController(orderService);
    const pickJobController = new PickJobController(pickJobService);
    const handoverJobController = new HandoverJobController(handoverJobService);

    this.serviceRouter.get('/status', asyncHandler(statusController.status));

    const middleware = [];
    if (enableAuth) {
      middleware.push(checkJwt);
    }

    if (fftEvents.ORDER_CREATED) {
      this.serviceRouter.post(fftEvents.ORDER_CREATED, middleware, asyncHandler(orderController.orderCreated));
    }
    if (fftEvents.PICK_JOB_CREATED) {
      this.serviceRouter.post(fftEvents.PICK_JOB_CREATED, middleware, asyncHandler(pickJobController.pickJobCreated));
    }
    if (fftEvents.PICK_JOB_PICKING_FINISHED) {
      this.serviceRouter.post(
        fftEvents.PICK_JOB_PICKING_FINISHED,
        middleware,
        asyncHandler(pickJobController.pickJobFinished)
      );
    }
    if (fftEvents.HANDOVERJOB_CREATED) {
      this.serviceRouter.post(
        fftEvents.HANDOVERJOB_CREATED,
        middleware,
        asyncHandler(handoverJobController.handoverJobCreated)
      );
    }
    if (fftEvents.HANDOVERJOB_HANDED_OVER) {
      this.serviceRouter.post(
        fftEvents.HANDOVERJOB_HANDED_OVER,
        middleware,
        asyncHandler(handoverJobController.handoverJobHandedOver)
      );
    }
  }

  public getRouter(): Router {
    return this.serviceRouter;
  }
}
