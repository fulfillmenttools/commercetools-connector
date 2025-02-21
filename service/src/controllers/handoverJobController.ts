import { NextFunction, Request, Response } from 'express';

import { HandoverJobService } from '../services/handoverJobService';
import { assertHandoverJobCreatedEvent, assertHandoverJobHandedOver } from './common';

export class HandoverJobController {
  constructor(private readonly handoverJobService: HandoverJobService) {
    this.handoverJobCreated = this.handoverJobCreated.bind(this);
    this.handoverJobHandedOver = this.handoverJobHandedOver.bind(this);
  }

  public async handoverJobCreated(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertHandoverJobCreatedEvent(body);
    const handoverJob = body.payload;
    await this.handoverJobService.handoverJobCreated(handoverJob);
    response.status(201).json({ id: handoverJob.id });
  }

  public async handoverJobHandedOver(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertHandoverJobHandedOver(body);
    const handoverJob = body.payload;
    await this.handoverJobService.handoverJobHandedOver(handoverJob);
    response.status(201).json({ id: handoverJob.id });
  }
}
