import { inject, injectable } from 'tsyringe';
import {
  Actions,
  FlattenedGeoJSONPoint,
  FlattenedGeoJSONLine,
  FlattenedGeoJSONPolygon,
  getChangeFromPoint,
  getChangeFromLine,
  getChangeFromPolygon,
} from '@map-colonies/osm-change-generator';
import { parseOsmWayApi, BaseElement, OsmNode, OsmWay, OsmChange, OsmElementType, OsmApiWay } from '@map-colonies/node-osm-elements';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { validateArrayHasElements } from '../../common/util';
import { ChangeModel } from './change';
import { OsmApiElements } from './helpers';
import { FlattenedGeoJSON } from './geojsonTypes';
import { ParseOsmElementsError } from './errors';
import { isNode, isWay } from './helpers';

export const generateOsmChange = (action: Actions, feature: FlattenedGeoJSON, osmElements: OsmApiElements): OsmChange => {
  switch (feature.geometry.type) {
    case 'Point': {
      feature = feature as FlattenedGeoJSONPoint;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromPoint({ action, feature });
        }
        case Actions.MODIFY: {
          const oldElement = getNodeFromElements(osmElements);
          return getChangeFromPoint({ action, feature, oldElement });
        }
        case Actions.DELETE: {
          const oldElement = getNodeFromElements(osmElements);
          return getChangeFromPoint({ action, oldElement });
        }
      }
      break;
    }
    case 'LineString': {
      feature = feature as FlattenedGeoJSONLine;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromLine({ action, feature });
        }
        case Actions.MODIFY: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromLine({ action, feature, oldElement });
        }
        case Actions.DELETE: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromLine({ action, oldElement });
        }
      }
      break;
    }
    case 'Polygon': {
      feature = feature as FlattenedGeoJSONPolygon;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromPolygon({ action, feature });
        }
        case Actions.MODIFY: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromPolygon({ action, feature, oldElement });
        }
        case Actions.DELETE: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromPolygon({ action, oldElement });
        }
      }
    }
  }
};

export const getNodeFromElements = (elements: OsmApiElements): OsmNode => {
  if (!validateArrayHasElements(elements)) {
    return throwParseOsmElementsError('node');
  }
  const node: OsmNode | OsmApiWay = elements[0];
  if (!isNode(node)) {
    return throwParseOsmElementsError('node');
  }
  return node;
};

export const getOsmWayFromElements = (elements: OsmApiElements): OsmWay => {
  const osmWay: OsmWay | undefined = parseOsmWayApi(elements);
  if (osmWay === undefined) {
    return throwParseOsmElementsError('way');
  }
  return osmWay;
};

/**
 * Gets the tempOsmId generated in the change, used on Create action.
 * @param {BaseElement[]} elements - Expected to be an array of either one OsmNode or one OsmWay and multiple OsmNodes
 * @returns {number} The id of either the only existing OsmNode element or OsmWay element
 */
export const getTempOsmId = (elements: BaseElement[]): number => {
  if (elements.length === 1) {
    return elements[0].id;
  }
  const way = elements.find(isWay);
  return (way as OsmWay).id;
};

export const throwParseOsmElementsError = (elementType: OsmElementType): never => {
  throw new ParseOsmElementsError(`Could not parse osm-api-elements, expected ${elementType as string} element`);
};

@injectable()
export class ChangeManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}
  public generateChange(action: Actions, geojson: FlattenedGeoJSON, osmElements: OsmApiElements, externalId: string): ChangeModel {
    const osmChange: OsmChange = generateOsmChange(action, geojson, osmElements);
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
