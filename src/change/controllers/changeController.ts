import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import { Actions } from '@map-colonies/osm-change-generator';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { ChangeManager } from '../models/changeManager';
import { ChangeModel } from '../models/change';
import { FlattenedGeoJSON } from '../models/geojsonTypes';
import { OsmApiElements } from '../models/helpers';

type CreateResourceHandler = RequestHandler<undefined, ChangeModel, ChangeRequestBody>;

export interface ChangeRequestBody {
  action: Actions;
  externalId: string;
  osmElements: OsmApiElements;
  geojson: FlattenedGeoJSON;
}

@injectable()
export class ChangeController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(ChangeManager) private readonly manager: ChangeManager) {}
  public createResource: CreateResourceHandler = (req, res, next) => {
    const { action, geojson, osmElements, externalId } = req.body;
    let change: ChangeModel;
    try {
      change = this.manager.generateChange(action, geojson, osmElements, externalId);
    } catch (error) {
      (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      return next(error);
    }
    return res.status(httpStatus.CREATED).json(change);
  };
}
