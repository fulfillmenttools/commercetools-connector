import { ProductPublishedMessage, ProductVariant } from '@commercetools/platform-sdk';

import { getChannelsWithRole, logger } from 'shared';
import { ProductMapper } from './productMapper';
import { FftFacilityService, FftListingService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

export class ProductProcessor {
  constructor(
    private readonly fftFacilityService: FftFacilityService,
    private readonly fftListingService: FftListingService,
    private readonly productMapper: ProductMapper
  ) {}

  async processProductPublished(message: ProductPublishedMessage): Promise<void> {
    if (message.resource?.typeId != 'product') {
      logger.warn(
        `Could not process CT message '${message.resource?.id}' - resource.typeId '${message.resource?.typeId}' != 'product'`
      );
      return;
    }

    logger.info(
      `Processing '${message.type}' message for '${message.resource.typeId}' '${message.resource.id}' '${message.resourceUserProvidedIdentifiers?.key}'`
    );

    const variants: ProductVariant[] = [];
    if (message.productProjection.masterVariant.sku) {
      variants.push(message.productProjection.masterVariant);
    }
    variants.push(
      ...message.productProjection.variants.filter((variant) => variant.sku !== undefined && variant.sku.length > 0)
    );

    if (variants.length === 0) {
      logger.info(
        `No SKUs defined for product variants, no listings will be created for product ${message.resource.id}`
      );
      return;
    }

    const tenantArticleIds = variants.map((variant) => variant.sku as string);

    const channels = await getChannelsWithRole('InventorySupply');
    if (channels === undefined || channels.length === 0) {
      logger.info(
        `No InventorySupply channels defined, no listings will be created for product ${message.resource.id}`
      );
      return;
    }

    const facilityIds = (
      await Promise.all(
        channels.map(async (channel) => {
          return await this.fftFacilityService.getFacilityId(channel.key, true);
        })
      )
    )?.filter((id) => id !== undefined && id.length > 0) as string[];

    if (facilityIds === undefined || facilityIds.length === 0) {
      logger.info(
        `No matching facilities for InventorySupply channels defined, no listings will be created for product ${message.resource.id}`
      );
      return;
    }

    logger.info(`Create/Update listing for ${message.resource.id} in ${facilityIds.length} facilities`);

    for (const tenantArticleId of tenantArticleIds) {
      for (const facilityId of facilityIds) {
        const listing = await this.productMapper.mapProduct(
          message.productProjection,
          tenantArticleId,
          message.resourceUserProvidedIdentifiers?.key
        );
        if (!listing) {
          continue;
        }
        const existingListing = await this.fftListingService.get(facilityId, tenantArticleId, true);
        if (existingListing) {
          listing.version = existingListing.version;
        }
        logger.info(`Create/Update listing for ${tenantArticleId} in ${facilityId}`, listing);
        await this.fftListingService.create(facilityId, listing);
      }
    }
  }
}
