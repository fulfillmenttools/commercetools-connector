import { ProductProjection } from '@commercetools/platform-sdk';
import { FftFacilityService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

import { logger } from 'shared';

export class ProductMapper {
  constructor(private readonly facilityService: FftFacilityService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async mapProduct(product: ProductProjection): Promise<void> {
    logger.info(`mapProduct: ${product.id} (${product.masterVariant.sku})`);
    // TODO
  }
}
