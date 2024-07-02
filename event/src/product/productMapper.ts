import { ProductProjection, ProductVariant } from '@commercetools/platform-sdk';
import { ListingForReplacement } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

import { logger } from 'shared';

export class ProductMapper {
  public async mapProduct(
    product: ProductProjection,
    tenantArticleId: string,
    productKey?: string
  ): Promise<ListingForReplacement | undefined> {
    logger.info(`mapProduct: ${product.id} (${product.masterVariant.sku})`);

    const variant = this.getVariant(product, tenantArticleId);
    if (!variant) {
      return undefined;
    }

    const listing: ListingForReplacement = {
      tenantArticleId,
      title: product.name['en-GB'], // TODO L10N
    };

    if (variant.images !== undefined && variant.images.length > 0) {
      listing.imageUrl = variant.images[0].url;
    }

    listing.customAttributes = {
      ctProductId: product.id,
      ctProductVariant: variant.id,
    };
    if (productKey) {
      listing.customAttributes.ctProductKey = productKey;
    }

    return listing;
  }

  getVariant(product: ProductProjection, tenantArticleId: string): ProductVariant | undefined {
    if (product.masterVariant.sku === tenantArticleId) {
      return product.masterVariant;
    }
    return product.variants.find((variant) => variant.sku === tenantArticleId);
  }
}
