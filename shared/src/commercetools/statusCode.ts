export function statusCode(err: unknown, defaultStatusCode = 500): number {
  if (err === undefined || err === null) {
    return defaultStatusCode;
  } else if (typeof err === 'number') {
    return err;
  } else if (typeof err === 'bigint') {
    return Number(BigInt.asIntN(64, err));
  } else if (typeof err === 'string') {
    const parsed = parseInt(err, 10);
    return isNaN(parsed) ? defaultStatusCode : parsed;
  } else if (typeof err === 'object') {
    if (Object.prototype.hasOwnProperty.call(err, 'status')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (err as any)['status'];
    } else if (Object.prototype.hasOwnProperty.call(err, 'statusCode')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (err as any)['statusCode'];
    }
  }
  return defaultStatusCode;
}
