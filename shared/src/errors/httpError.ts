export interface HttpError {
  message: string;
  name: string;
  status: number;
}

export function isHttpError(object: unknown): object is HttpError {
  return object !== null && typeof object === 'object' && 'message' in object && 'status' in object;
}
