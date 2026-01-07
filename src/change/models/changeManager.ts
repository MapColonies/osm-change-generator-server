import { inject, injectable } from 'tsyringe';
import {
  Actions,
  FlattenedGeoJSONPoint,
  FlattenedGeoJSONLine,
  FlattenedGeoJSONPolygon,
  getChangeFromPoint,
  getChangeFromLine,
  getChangeFromPolygon,
  GetChangeOptions,
} from '@map-colonies/osm-change-generator';
import { parseOsmWayApi, BaseElement, OsmNode, OsmWay, OsmChange, OsmElementType, OsmApiWay } from '@map-colonies/node-osm-elements';
import type { Logger } from '@map-colonies/js-logger';
import type { ConfigType } from '@src/common/config';
import { SERVICES } from '../../common/constants';
import { validateArrayHasElements } from '../../common/util';
import { IApp } from '../../common/interfaces';
import { ChangeModel } from './change';
import { OsmApiElements, isNode, isWay } from './helpers';
import { FlattenedGeoJSON, FlattenOptionalGeometry } from './geojsonTypes';
import { ParseOsmElementsError } from './errors';

type GenerateOsmChangeArgs =
  | { action: Actions.DELETE; osmElements: OsmApiElements }
  | {
      action: Actions.CREATE | Actions.MODIFY;
      osmElements: OsmApiElements;
      feature: FlattenedGeoJSON;
      options?: GetChangeOptions;
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

  const { options } = args;
  let { feature } = args;

  switch (feature.geometry.type) {
    case 'Point': {
      feature = feature as FlattenedGeoJSONPoint;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromPoint({ action, feature, options });
        }
        case Actions.MODIFY: {
          const oldElement = getNodeFromElements(osmElements);
          return getChangeFromPoint({ action, feature, oldElement, options });
        }
      }
      break;
    }
    case 'LineString': {
      feature = feature as FlattenedGeoJSONLine;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromLine({ action, feature, options });
        }
        case Actions.MODIFY: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromLine({ action, feature, oldElement, options });
        }
      }
      break;
    }
    case 'Polygon': {
      feature = feature as FlattenedGeoJSONPolygon;
      switch (action) {
        case Actions.CREATE: {
          return getChangeFromPolygon({ action, feature, options });
        }
        case Actions.MODIFY: {
          const oldElement = getOsmWayFromElements(osmElements);
          return getChangeFromPolygon({ action, feature, oldElement, options });
        }
      }
    }
  }
};

export const getNodeFromElements = (elements: OsmApiElements): OsmNode => {
  if (!validateArrayHasElements(elements)) {
    return throwParseOsmElementsError();
  }
  const node: OsmNode | OsmApiWay = elements[0]!;
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
    return elements[0]!.id;
  }
  const way = elements.find(isWay);
  return (way as OsmWay).id;
};

export const throwParseOsmElementsError = (elementType?: OsmElementType): never => {
  const elaborativeExpected = elementType ?? 'at least one';
  throw new ParseOsmElementsError(`Could not parse osm-api-elements, expected ${elaborativeExpected} element`);
};

@injectable()
export class ChangeManager {
  private readonly options?: GetChangeOptions;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: ConfigType
  ) {
    const { shouldHandleLOD2, shouldHandlePrecision, maxTagKeyLength, maxTagValueLength } = this.config.get('app') as IApp;
    this.options = { shouldHandleLOD2, shouldHandlePrecision, maxTagKeyLength, maxTagValueLength };
  }

  public generateChange(action: Actions, geojson: FlattenOptionalGeometry, osmElements: OsmApiElements, externalId: string): ChangeModel {
    this.logger.info({ msg: 'starting change generation', externalId });

    try {
      const args: GenerateOsmChangeArgs =
        action === Actions.DELETE ? { action, osmElements } : { action, osmElements, feature: geojson as FlattenedGeoJSON, options: this.options };
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
