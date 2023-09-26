import { NextFunction, Request, Response } from 'express';

import { PickJob } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { PickJobService } from '../services/pickJobService';
import { assertPickJobCreatedEvent, assertPickJobFinishedEvent } from './common';

export class PickJobController {
  constructor(private readonly pickJobService: PickJobService) {
    this.pickJobCreated = this.pickJobCreated.bind(this);
    this.pickJobFinished = this.pickJobFinished.bind(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async pickJobCreated(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertPickJobCreatedEvent(body);
    const pickJob = body.payload as PickJob;
    await this.pickJobService.pickJobCreated(pickJob);
    response.status(201).json({ id: pickJob.id });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async pickJobFinished(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertPickJobFinishedEvent(body);
    const pickJob = body.payload as PickJob;
    await this.pickJobService.pickJobFinished(pickJob);
    response.status(201).json({ id: pickJob.id });
  }
}
