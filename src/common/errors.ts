import { StatusCodes } from 'http-status-codes';

export class InternalServerError extends Error {
  public status = StatusCodes.INTERNAL_SERVER_ERROR;
}
