import { PickJob, FftLoadUnitService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

import { FFTConstants, logger } from 'shared';
import { getCommercetoolsOrderById, updateCommercetoolsOrder } from 'shared';
import { setCustomFieldAction, updateOrderAction } from 'shared';

export class PickJobService {
  constructor(private readonly loadUnitService: FftLoadUnitService) {}

  public async pickJobCreated(pickJob: PickJob): Promise<void> {
    logger.info(`FFT PickJob created '${pickJob.id}'`);

    const commercetoolsOrderId: string | undefined = pickJob.customAttributes?.commercetoolsId;
    if (!commercetoolsOrderId) {
      logger.info(`Ignoring FFT order '${pickJob.orderRef}' because it does not correspond to a CT order`);
      return;
    }

    const commercetoolsOrder = await getCommercetoolsOrderById(commercetoolsOrderId);

    const actions = [
      setCustomFieldAction(FFTConstants.PICKJOB_ID, pickJob.id),
      setCustomFieldAction(FFTConstants.SHORTID, pickJob.shortId),
      setCustomFieldAction(FFTConstants.FACILITY_ID, pickJob.facilityRef),
    ];
    const updateAction = updateOrderAction(commercetoolsOrder, actions);
    await updateCommercetoolsOrder(commercetoolsOrder.id, updateAction);

    logger.info(`Updated CT order '${commercetoolsOrder.id}' with FFT pickJob id '${pickJob.id}'`);
  }

  public async pickJobFinished(pickJob: PickJob): Promise<void> {
    logger.info(`FFT PickJob finished '${pickJob.id}'`);

    const commercetoolsOrderId: string | undefined = pickJob.customAttributes?.commercetoolsId;
    if (!commercetoolsOrderId) {
      logger.info(`Ignoring FFT order '${pickJob.orderRef}' because it does not correspond to a CT order`);
      return;
    }

    const commercetoolsOrder = await getCommercetoolsOrderById(commercetoolsOrderId);

    const loadUnits = await this.loadUnitService.findByPickJobRef(pickJob.id);
    if (loadUnits && loadUnits.length > 0) {
      const actions = [setCustomFieldAction(FFTConstants.LOAD_UNITS_AMOUNT, loadUnits.length)];
      const updateAction = updateOrderAction(commercetoolsOrder, actions);

      await updateCommercetoolsOrder(commercetoolsOrder.id, updateAction);

      logger.info(`Updated CT order '${commercetoolsOrder.id}' with FFT load units information`);
    }
  }
}
