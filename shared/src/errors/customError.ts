type ErrorItem = {
  statusCode: number | string;
  message: string;
  referencedBy?: string;
};

export class CustomError extends Error {
  statusCode: number;
  errors?: ErrorItem[];
  constructor(statusCode: number, message: string, errors?: ErrorItem[]) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
  }
}

export function isErrorItem(object: unknown): object is ErrorItem {
  return object !== null && typeof object === 'object' && 'message' in object && 'statusCode' in object;
}
