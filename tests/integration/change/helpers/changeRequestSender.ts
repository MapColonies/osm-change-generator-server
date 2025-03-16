import type { Application } from 'express';
import * as supertest from 'supertest';
import { ChangeRequestBody } from '@src/change/controllers/changeController';

export class DocsRequestSender {
  public constructor(private readonly app: Application) {}

  public async postChange(body: ChangeRequestBody): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/change').set('Content-Type', 'application/json').send(body);
  }
}
