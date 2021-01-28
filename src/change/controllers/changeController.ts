import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from 'express-openapi-validator/dist/framework/types';

import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { ChangeManager } from '../models/changeManager';
import { ChangeModel } from '../models/change';
import { GeneratedOsmChangeInvalidError, ParseOsmElementsError } from '../models/errors';
import { FlattenedGeoJSON } from '../models/geojsonTypes';
import { OsmApiElements } from '../models/helpers';

interface ChangeRequestBody {
  action: Actions;
  externalId: string;
  osmElements: OsmApiElements;
  geojson: FlattenedGeoJSON;
}

type CreateResourceHandler = RequestHandler<undefined, ChangeModel, ChangeRequestBody>;

@injectable()
export class ChangeController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(ChangeManager) private readonly manager: ChangeManager) {}
  public createResource: CreateResourceHandler = (req, res, next) => {
    const { action, geojson, osmElements, externalId } = req.body;
    let change: ChangeModel;
    try {
      change = this.manager.handle(action, geojson, osmElements, externalId);
    } catch (error) {
      if (error instanceof ParseOsmElementsError) {
        (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      }
      if (error instanceof GeneratedOsmChangeInvalidError) {
        (error as HttpError).status = httpStatus.INTERNAL_SERVER_ERROR;
      }
      return next(error);
    }
    return res.status(httpStatus.CREATED).json(change);
  };
}
