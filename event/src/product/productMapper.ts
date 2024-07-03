import { ProductProjection, ProductVariant } from '@commercetools/platform-sdk';
import {
  ArticleAttributeItem,
  ListingAttributeItem,
  ListingForReplacement,
  LocaleString,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

export class ProductMapper {
  public async mapProduct(
    product: ProductProjection,
    languages: string[],
    tenantArticleId: string
  ): Promise<ListingForReplacement | undefined> {
    const variant = this.getVariant(product, tenantArticleId);
    if (!variant) {
      return undefined;
    }

    const listing: ListingForReplacement = {
      tenantArticleId,
      title: 'title', // will be overwritten by localized title
    };

    const titleLocalized: LocaleString = {};
    for (const language of languages) {
      if (product.name[language]) {
        titleLocalized[this.mapLocale(language)] = product.name[language];
      }
    }
    listing.titleLocalized = titleLocalized;

    const attr: ListingAttributeItem = {
      category: ArticleAttributeItem.CategoryEnum.Descriptive,
      key: '%%subtitle%%',
      value: 'value', // will be overwritten by localized value
    };

    const valueLocalized: LocaleString = {};
    for (const language of languages) {
      if (product.description?.[language]) {
        valueLocalized[this.mapLocale(language)] = product.description[language];
      }
    }
    attr.valueLocalized = valueLocalized;

    listing.attributes = [attr];

    if (variant.images !== undefined && variant.images.length > 0) {
      listing.imageUrl = variant.images[0].url;
    }

    listing.customAttributes = {
      ctProductId: product.id,
      ctProductVariant: variant.id,
    };

    if (product.key) {
      listing.customAttributes.ctProductKey = product.key;
    }

    return listing;
  }

  getVariant(product: ProductProjection, tenantArticleId: string): ProductVariant | undefined {
    if (product.masterVariant.sku === tenantArticleId) {
      return product.masterVariant;
    }
    return product.variants.find((variant) => variant.sku === tenantArticleId);
  }

  mapLocale(source: string): string {
    return source.replace('-', '_');
  }
}
