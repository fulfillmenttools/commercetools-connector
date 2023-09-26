import { CustomError } from './customError';

export class AmbiguousChannelError extends CustomError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, AmbiguousChannelError.prototype);
  }
}
