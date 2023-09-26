import { Request, Response } from 'express';

export class StatusController {
  public async status(_request: Request, response: Response): Promise<void> {
    response.status(200).json({ status: 'UP' });
  }
}
