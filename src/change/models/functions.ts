/* eslint-disable no-fallthrough */ // the rule is not typescript aware in this case
import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import { parseOsmWayApi, BaseElement, OsmNode, OsmWay, OsmChange, OsmElementType } from '@map-colonies/node-osm-elements';
import { getChangeFromPoint, getChangeFromLine, getChangeFromPolygon } from '@map-colonies/osm-change-generator';

import { validateArrayHasElements } from '../../common/util';
import { FlattenedGeoJSON, FlattenedGeoJSONPoint, FlattenedGeoJSONLine, FlattenedGeoJSONPolygon } from './geojsonTypes';
import { ParseOsmElementsError } from './errors';
import { isNode, isWay, OsmApiElements } from './helpers';

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
    throwParseOsmElementsError('node');
  }
  const node = elements[0];
  if (!isNode(node)) {
    throwParseOsmElementsError('node');
  }
  return node as OsmNode;
};

export const getOsmWayFromElements = (elements: OsmApiElements): OsmWay => {
  const osmWay = parseOsmWayApi(elements);
  if (osmWay === undefined) {
    throwParseOsmElementsError('way');
  }
  return osmWay as OsmWay;
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
