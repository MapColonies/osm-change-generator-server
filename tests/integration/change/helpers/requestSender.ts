import type { Application } from 'express';
import { type Response, agent } from 'supertest';
import { ChangeRequestBody } from '../../../../src/change/controllers/changeController';

export class ChangeRequestSender {
  public constructor(private readonly app: Application) {}

  public async postChange(body: ChangeRequestBody): Promise<Response> {
    return agent(this.app).post('/change').set('Content-Type', 'application/json').send(body);
  }
}
