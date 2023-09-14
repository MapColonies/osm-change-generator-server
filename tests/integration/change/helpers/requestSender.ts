import * as supertest from 'supertest';
import { ChangeRequestBody } from '../../../../src/change/controllers/changeController';

export class ChangeRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async postChange(body: ChangeRequestBody): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/change').set('Content-Type', 'application/json').send(body);
  }
}
