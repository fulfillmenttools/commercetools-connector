/**
 * Serializes an error into something that actually survives logging.
 *
 * `JSON.stringify(error)` is useless for Error instances: `message` and `stack`
 * are non-enumerable, so a thrown Error collapses to `{}`. The fulfillmenttools
 * SDK throws `Error` subclasses (SdkError/ApiError/FetchError), which is exactly
 * the case that used to get lost.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details: Record<string, any> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    // SDK errors carry these as own properties, plain Errors do not
    for (const key of ['status', 'statusText', 'type', 'statusCode']) {
      const value = (error as unknown as Record<string, unknown>)[key];
      if (value !== undefined) {
        details[key] = value;
      }
    }
    // `cause` needs lib es2022, which this project does not target
    const cause = (error as unknown as Record<string, unknown>)['cause'];
    if (cause !== undefined) {
      details.cause = formatError(cause);
    }
    return details;
  }
  if (typeof error === 'object' && error !== null) {
    return { ...error };
  }
  return { message: String(error) };
}
