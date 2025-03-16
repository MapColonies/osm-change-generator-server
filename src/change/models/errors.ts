import { HttpError } from '@map-colonies/error-express-handler';
import httpStatusCodes from 'http-status-codes';

export class ParseOsmElementsError extends Error implements HttpError {
  public readonly status = httpStatusCodes.UNPROCESSABLE_ENTITY;

  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ParseOsmElementsError.prototype);
  }
}
