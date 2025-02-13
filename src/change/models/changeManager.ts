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
import { Logger } from '@map-colonies/js-logger';
import { SERVICES, SHOULD_HANDLE_3D } from '../../common/constants';
import { validateArrayHasElements } from '../../common/util';
import { ChangeModel } from './change';
import { OsmApiElements } from './helpers';
import { FlattenedGeoJSON, FlattenOptionalGeometry } from './geojsonTypes';
import { ParseOsmElementsError } from './errors';
import { isNode, isWay } from './helpers';

type GenerateOsmChangeArgs =
  | { action: Actions.DELETE; osmElements: OsmApiElements }
  | {
      action: Actions.CREATE | Actions.MODIFY;
      osmElements: OsmApiElements;
      feature: FlattenedGeoJSON;
      shouldHandle3D?: boolean;
    };

export const generateOsmChange = (args: GenerateOsmChangeArgs): OsmChange => {
  const { action, osmElements } = args;

  if (action === Actions.DELETE) {
    const includesWay = osmElements.some((element) => isWay(element));
    if (includesWay) {
      const oldElement = getOsmWayFromElements(osmElements);
      return getChangeFromPolygon({ action, oldElement });
    } else {
      const oldElement = getNodeFromElements(osmElements);
      return getChangeFromPoint({ action, oldElement });
    }
  }

  const { shouldHandle3D } = args;
  let { feature } = args;

  switch (feature.geometry.type) {
    case 'Point': {
      feature = feature as FlattenedGeoJSONPoint;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromPoint({ action, feature, shouldHandle3D });
        }
        case Actions.MODIFY: {
          const oldElement = getNodeFromElements(osmElements);
          return getChangeFromPoint({ action, feature, oldElement, shouldHandle3D });
        }
      }
      break;
    }
    case 'LineString': {
      feature = feature as FlattenedGeoJSONLine;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromLine({ action, feature, shouldHandle3D });
        }
        case Actions.MODIFY: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromLine({ action, feature, oldElement, shouldHandle3D });
        }
      }
      break;
    }
    case 'Polygon': {
      feature = feature as FlattenedGeoJSONPolygon;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromPolygon({ action, feature, shouldHandle3D });
        }
        case Actions.MODIFY: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromPolygon({ action, feature, oldElement, shouldHandle3D });
        }
      }
    }
  }
};

export const getNodeFromElements = (elements: OsmApiElements): OsmNode => {
  if (!validateArrayHasElements(elements)) {
    return throwParseOsmElementsError();
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

export const throwParseOsmElementsError = (elementType?: OsmElementType): never => {
  const elaborativeExpected = elementType ? elementType : 'at least one';
  throw new ParseOsmElementsError(`Could not parse osm-api-elements, expected ${elaborativeExpected} element`);
};

@injectable()
export class ChangeManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SHOULD_HANDLE_3D) private readonly shouldHandle3D: boolean
  ) {}

  public generateChange(action: Actions, geojson: FlattenOptionalGeometry, osmElements: OsmApiElements, externalId: string): ChangeModel {
    this.logger.info({ msg: 'starting change generation', externalId });

    try {
      const args: GenerateOsmChangeArgs =
        action === Actions.DELETE
          ? { action, osmElements }
          : { action, osmElements, feature: geojson as FlattenedGeoJSON, shouldHandle3D: this.shouldHandle3D };
      const osmChange = generateOsmChange(args);

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
    } catch (e) {
      this.logger.error({ err: e as Error, externalId, msg: 'failed to generate change' });
      throw e;
    }
  }
}
