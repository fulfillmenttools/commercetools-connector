/**
 * Shows what the connector actually sends to fulfillmenttools for a given
 * commercetools order - and, on request, sends it and prints the response.
 *
 * When fulfillmenttools answers a create with 400, the SDK keeps the status
 * code and throws the response body away, so the log only ever says
 * "Bad Request". This script closes that gap: it runs the real OrderMapper
 * against a real order and, with `--post`, performs the real create with the
 * error-response logging from `createFftApiClient` switched on.
 *
 *   npm run debug:order -- XDE900000H
 *   npm run debug:order -- XDE900000H --post
 *
 * Reads credentials from event/.env.local (override with --env <path>).
 *
 * Everything is imported lazily: `shared` validates the environment while it is
 * being imported, so dotenv has to run first.
 */
import * as dotenv from 'dotenv';

import { existsSync } from 'fs';
import { resolve } from 'path';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseArgs(argv: string[]): { order: string; post: boolean; envFile: string } {
  const args = argv.slice(2);
  const envIndex = args.indexOf('--env');
  const envFile = envIndex >= 0 ? args[envIndex + 1] : '.env.local';
  const envValueIndex = envIndex >= 0 ? envIndex + 1 : -1;
  const order = args.find((arg, index) => !arg.startsWith('--') && index !== envValueIndex);
  if (!order) {
    throw new Error('Usage: npm run debug:order -- <orderNumber|orderId> [--post] [--env <path>]');
  }
  return { order, post: args.includes('--post'), envFile };
}

async function main(): Promise<void> {
  const { order: orderIdOrNumber, post, envFile } = parseArgs(process.argv);
  const envPath = resolve(process.cwd(), envFile);
  if (!existsSync(envPath)) {
    throw new Error(`Env file '${envPath}' not found, pass --env <path>`);
  }
  dotenv.config({ path: envPath });

  const { FftFacilityService, FftOrderService } = await import('@fulfillmenttools/fulfillmenttools-sdk-typescript');
  const { createApiRoot, createFftApiClient, formatError, getCommercetoolsOrderById, StoreService } = await import(
    'shared'
  );
  const { OrderMapper } = await import('../src/order/orderMapper');

  const orderId = UUID_PATTERN.test(orderIdOrNumber)
    ? orderIdOrNumber
    : (await createApiRoot().orders().withOrderNumber({ orderNumber: orderIdOrNumber }).get().execute()).body.id;
  // always go through the connector's own getter, for the expansions it relies on
  const commercetoolsOrder = await getCommercetoolsOrderById(orderId);

  const fftApiClient = createFftApiClient();
  const orderMapper = new OrderMapper(new StoreService(), new FftFacilityService(fftApiClient));
  const fulfillmenttoolsOrder = await orderMapper.mapOrder(commercetoolsOrder);
  process.stdout.write(`${JSON.stringify(fulfillmenttoolsOrder, undefined, 2)}\n`);

  if (!post) {
    process.stdout.write('\nNot sent. Add --post to create this order in fulfillmenttools.\n');
    return;
  }
  try {
    const created = await new FftOrderService(fftApiClient).create(fulfillmenttoolsOrder);
    process.stdout.write(`\nCreated fulfillmenttools order '${created?.id}'\n`);
  } catch (error) {
    // the body of the failed response is logged by installFftErrorResponseLogging
    process.stdout.write(`\nCreate failed: ${JSON.stringify(formatError(error))}\n`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exit(1);
});
