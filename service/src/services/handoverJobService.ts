import { Order, OrderSetCustomFieldAction } from '@commercetools/platform-sdk';
import {
  FftOrderService,
  FftParcelService,
  FftShipmentService,
  Handoverjob,
  Parcel,
  Shipment,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import {
  FFTConstants,
  changeShipmentStateAction,
  getCommercetoolsOrderById,
  logger,
  setCustomFieldAction,
  updateCommercetoolsOrder,
  updateOrderAction,
} from 'shared';
import { canUpdateOrder } from './orderService';

export class HandoverJobService {
  constructor(
    private readonly fftOrderService: FftOrderService,
    private readonly fftShipmentService: FftShipmentService,
    private readonly fftParcelService: FftParcelService
  ) {}

  public async handoverJobCreated(handoverJob: Handoverjob): Promise<void> {
    logger.info(`FFT HandoverJob created ${handoverJob.id}`);

    const commercetoolsOrder = await this.getCommercetoolsOrderForHandoverJob(handoverJob);
    if (!commercetoolsOrder) {
      return;
    }
    if (!canUpdateOrder(commercetoolsOrder)) {
      return;
    }
    const actions = [
      setCustomFieldAction(FFTConstants.HANDOVER_JOB_ID, handoverJob.id),
      changeShipmentStateAction('Ready'),
    ];
    const trackingDataAction = await this.trackingDataAction(handoverJob);
    if (trackingDataAction) {
      actions.push(trackingDataAction);
    }
    const updateAction = updateOrderAction(commercetoolsOrder, actions);

    await updateCommercetoolsOrder(commercetoolsOrder.id, updateAction);

    logger.info(
      `Updated CT order '${commercetoolsOrder.id}' with FFT HandoverJob id '${handoverJob.id}', shipmentState=Ready`
    );
  }

  public async handoverJobHandedOver(handoverJob: Handoverjob): Promise<void> {
    logger.info(`FFT HandoverJob handed over ${handoverJob.id}`);

    const commercetoolsOrder = await this.getCommercetoolsOrderForHandoverJob(handoverJob);
    if (!commercetoolsOrder) {
      return;
    }
    if (!canUpdateOrder(commercetoolsOrder)) {
      return;
    }
    const actions = [changeShipmentStateAction('Shipped')];
    const updateAction = updateOrderAction(commercetoolsOrder, actions);

    await updateCommercetoolsOrder(commercetoolsOrder.id, updateAction);

    logger.info(`Updated CT order '${commercetoolsOrder.id}' with shipmentState=Shipped`);
  }

  private async getCommercetoolsOrderForHandoverJob(handoverJob: Handoverjob): Promise<Order | undefined> {
    if (!handoverJob.tenantOrderId) {
      logger.info(`Ignoring HandoverJob '${handoverJob.id}' because it does not have a tenantOrderId`);
      return undefined;
    }
    const fftStrippedOrder = await this.fftOrderService.findByTenantOrderId(handoverJob.tenantOrderId);
    if (!fftStrippedOrder) {
      logger.info(`Ignoring HandoverJob '${handoverJob.id}' because it does not correspond to a FFT order`);
      return undefined;
    }

    const fftOrder = await this.fftOrderService.findBy(fftStrippedOrder.id);

    const commercetoolsOrderId: string | undefined = fftOrder.customAttributes?.commercetoolsId;
    if (!commercetoolsOrderId) {
      logger.info(`Ignoring HandoverJob '${handoverJob.id}' because it does not correspond to a CT order`);
      return undefined;
    }

    return await getCommercetoolsOrderById(commercetoolsOrderId);
  }

  private async trackingDataAction(handoverJob: Handoverjob): Promise<OrderSetCustomFieldAction | undefined> {
    try {
      if (!handoverJob.shipmentRef) {
        return undefined;
      }
      const shipment: Shipment = await this.fftShipmentService.findById(handoverJob.shipmentRef);
      if (shipment.parcels === undefined) {
        logger.warn(`Shipment '${shipment.id}' has no parcels => skip`);
        return undefined;
      }
      const parcels: Parcel[] = await this.fftParcelService.findMultiple(shipment.parcels.map((p) => p.parcelRef));
      const parcelData = parcels.map((p) => {
        return { tracking_number: p.result?.carrierTrackingNumber, tracking_url: p.result?.trackingUrl };
      });
      return setCustomFieldAction(FFTConstants.PARCELS, JSON.stringify(parcelData));
    } catch (err) {
      logger.warn(
        `Could not retrieve shipment information for CT order '${handoverJob.tenantOrderId}', HandoverJob '${handoverJob.id}'`,
        err
      );
      return undefined;
    }
  }
}
