import { BoundCounter, Meter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import { Actions } from '@map-colonies/osm-change-generator';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../../common/constants';
import { ChangeManager } from '../models/changeManager';
import { ChangeModel } from '../models/change';
import { FlattenOptionalGeometry } from '../models/geojsonTypes';
import { OsmApiElements } from '../models/helpers';

type CreateChangeHandler = RequestHandler<undefined, ChangeModel, ChangeRequestBody>;

export interface ChangeRequestBody {
  action: Actions;
  externalId: string;
  osmElements: OsmApiElements;
  geojson: FlattenOptionalGeometry;
}

@injectable()
export class ChangeController {
  private readonly createdChangeCounter: BoundCounter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ChangeManager) private readonly manager: ChangeManager,
    @inject(SERVICES.METER) private readonly meter: Meter
  ) {
    this.createdChangeCounter = meter.createCounter('created_change');
  }
  public createChange: CreateChangeHandler = (req, res, next) => {
    const { action, geojson, osmElements, externalId } = req.body;
    let change: ChangeModel;
    try {
      change = this.manager.generateChange(action, geojson, osmElements, externalId);
    } catch (error) {
      (error as HttpError).status = httpStatus.UNPROCESSABLE_ENTITY;
      return next(error);
    }
    this.createdChangeCounter.add(1);
    return res.status(httpStatus.CREATED).json(change);
  };
}
