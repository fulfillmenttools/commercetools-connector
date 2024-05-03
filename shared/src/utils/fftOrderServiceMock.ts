import {
  FftApiClient,
  FftOrderService,
  Order,
  OrderForCreation,
  OrderForCreationConsumer,
  OrderStatus,
  StrippedOrder,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { delay } from './delay';

export class FftOrderServiceMock extends FftOrderService {
  constructor() {
    super(new FftApiClient('projectId', 'apiUser', 'apiPassword', 'apiKey'));
  }
  private wait = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async findByTenantOrderId(tenantOrderId: string): Promise<StrippedOrder | undefined> {
    while (this.wait) {
      await delay(100);
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async create(orderForCreation: OrderForCreation): Promise<Order> {
    const consumer: OrderForCreationConsumer = { addresses: [] };
    return {
      consumer: consumer,
      id: '7c801788-eb1c-4afd-95d0-77e6ce377500',
      orderDate: new Date(),
      orderLineItems: [],
      status: OrderStatus.OPEN,
      version: 0,
      processId: 'e2e199ac-f534-4fe1-a5b2-4fbb9bd679ce',
    };
  }

  public freeze() {
    this.wait = true;
  }
  public continue() {
    this.wait = false;
  }
}
