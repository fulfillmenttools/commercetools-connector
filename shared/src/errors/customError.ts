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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isErrorItem(object: any): object is ErrorItem {
  return 'message' in object && 'statusCode' in object;
}
