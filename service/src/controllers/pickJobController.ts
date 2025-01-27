import { NextFunction, Request, Response } from 'express';

import { PickJobService } from '../services/pickJobService';
import { assertPickJobCreatedEvent, assertPickJobFinishedEvent } from './common';

export class PickJobController {
  constructor(private readonly pickJobService: PickJobService) {
    this.pickJobCreated = this.pickJobCreated.bind(this);
    this.pickJobFinished = this.pickJobFinished.bind(this);
  }

  public async pickJobCreated(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertPickJobCreatedEvent(body);
    const pickJob = body.payload;
    await this.pickJobService.pickJobCreated(pickJob);
    response.status(201).json({ id: pickJob.id });
  }

  public async pickJobFinished(request: Request, response: Response, _next: NextFunction): Promise<void> {
    const body = request.body;
    assertPickJobFinishedEvent(body);
    const pickJob = body.payload;
    await this.pickJobService.pickJobFinished(pickJob);
    response.status(201).json({ id: pickJob.id });
  }
}
