import { NextFunction, Request, Response } from 'express';

import { OrderService } from '../services/orderService';
import { assertOrderCreatedEvent } from './common';

export class OrderController {
  constructor(private readonly orderService: OrderService) {
    this.orderCreated = this.orderCreated.bind(this);
  }

  public async orderCreated(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertOrderCreatedEvent(body);
    const order = body.payload;
    await this.orderService.orderCreated(order);
    response.status(201).json({ id: order.id });
  }
}
