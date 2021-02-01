/* eslint-disable no-fallthrough */ // the rule is not typescript aware in this case
import { inject, injectable } from 'tsyringe';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { FlattenedGeoJSON } from './geojsonTypes';
import { ChangeModel } from './change';
import { GeneratedOsmChangeInvalidError } from './errors';
import { OsmApiElements } from './helpers';
import { generateChange, isOsmChangeValid, getTempOsmId } from './functions';

@injectable()
export class ChangeManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}
  public handle(action: Actions, geojson: FlattenedGeoJSON, osmElements: OsmApiElements, externalId: string): ChangeModel {
    const osmChange = generateChange(action, geojson, osmElements);
    if (!isOsmChangeValid(action, osmChange)) {
      throw new GeneratedOsmChangeInvalidError('generated osm-change is invalid.');
    }
    let changeModel: ChangeModel = {
      action,
      change: osmChange,
      externalId,
    };
    if (action === Actions.CREATE && osmChange.create) {
      const tempOsmId = getTempOsmId(osmChange.create);
      changeModel = {
        ...changeModel,
        tempOsmId,
      };
    }
    return changeModel;
  }
}
