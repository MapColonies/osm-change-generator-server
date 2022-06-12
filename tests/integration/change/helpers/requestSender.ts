import * as supertest from 'supertest';
import { Application } from 'express';
import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';
import { ChangeRequestBody } from '../../../../src/change/controllers/changeController';

let app: Application | null = null;

export function init(): void {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  app = builder.build();
}

export async function postChange(body: ChangeRequestBody): Promise<supertest.Response> {
  return supertest.agent(app).post('/change').set('Content-Type', 'application/json').send(body);
}
