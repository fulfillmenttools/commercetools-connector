import { CustomError } from './customError';

export class ResourceLockedError extends CustomError {
  constructor(message: string) {
    super(423, message);
    Object.setPrototypeOf(this, ResourceLockedError.prototype);
  }
}
