import { NextFunction, Request, Response } from 'express';

import { Handoverjob } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { HandoverJobService } from '../services/handoverJobService';
import { assertHandoverJobCreatedEvent, assertHandoverJobHandedOver } from './common';

export class HandoverJobController {
  constructor(private readonly handoverJobService: HandoverJobService) {
    this.handoverJobCreated = this.handoverJobCreated.bind(this);
    this.handoverJobHandedOver = this.handoverJobHandedOver.bind(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handoverJobCreated(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertHandoverJobCreatedEvent(body);
    const handoverJob = body.payload as Handoverjob;
    await this.handoverJobService.handoverJobCreated(handoverJob);
    response.status(201).json({ id: handoverJob.id });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handoverJobHandedOver(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertHandoverJobHandedOver(body);
    const handoverJob = body.payload as Handoverjob;
    await this.handoverJobService.handoverJobHandedOver(handoverJob);
    response.status(201).json({ id: handoverJob.id });
  }
}
