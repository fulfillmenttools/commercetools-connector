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
  public override async findByTenantOrderId(_tenantOrderId: string): Promise<StrippedOrder | undefined> {
    while (this.wait) {
      await delay(100);
    }
    return undefined;
  }

  public override async create(_orderForCreation: OrderForCreation): Promise<Order> {
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
