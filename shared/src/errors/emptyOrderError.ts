import { CustomError } from './customError';

/**
 * A commercetools order that cannot become a fulfillmenttools order because it
 * has no line items to fulfill. Retrying cannot change that, so this is a
 * permanent failure, not a transient one.
 */
export class EmptyOrderError extends CustomError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, EmptyOrderError.prototype);
  }
}
