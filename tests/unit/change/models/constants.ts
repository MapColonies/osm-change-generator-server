import { OsmChange, OsmWay } from '@map-colonies/node-osm-elements';
import { getChangeFromLine } from '@map-colonies/osm-change-generator';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import {
  FeatureType,
  FlattenedGeoJSON,
  FlattenedGeoJSONLine,
  FlattenedGeoJSONPoint,
  FlattenedGeoJSONPolygon,
} from '../../../../src/change/models/geojsonTypes';
import { generateOsmApiElements, generateWay, getRamdomArrayOfCoordinates } from './helpers';
import { getRandomCoordinate } from './helpers';

const externalId = 'some_external_id';

const oldElement: OsmWay = generateWay();

const point: FlattenedGeoJSONPoint = {
  geometry: { type: 'Point', coordinates: [getRandomCoordinate(), getRandomCoordinate()] },
  type: 'Feature',
  properties: { dog: 'meow' },
};

const line: FlattenedGeoJSONLine = {
  type: 'Feature',
  properties: { dog: 'meow' },
  geometry: {
    type: 'LineString',
    coordinates: getRamdomArrayOfCoordinates(),
  },
};

const polygon: FlattenedGeoJSONPolygon = {
  type: 'Feature',
  properties: { dog: 'meow' },
  geometry: {
    type: 'Polygon',
    coordinates: [getRamdomArrayOfCoordinates()],
  },
};

const allActions: Readonly<Actions[]> = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

const createChange = getChangeFromLine({ action: Actions.CREATE, feature: line });
const modifyChange = getChangeFromLine({ action: Actions.MODIFY, feature: line, oldElement });
const deleteChange = getChangeFromLine({ action: Actions.DELETE, oldElement });

const actionToChangeMap = new Map<Actions, OsmChange>([
  [Actions.CREATE, createChange],
  [Actions.MODIFY, modifyChange],
  [Actions.DELETE, deleteChange],
]);

const templateChangeRequest = {
  externalId,
  osmElements: generateOsmApiElements(),
  geojson: line,
};

const allFeatureTypes: Readonly<FeatureType[]> = ['Point', 'LineString', 'Polygon'] as const;

const featureTypeToInstanceMap = new Map<FeatureType, FlattenedGeoJSON>([
  ['Point', point],
  ['LineString', line],
  ['Polygon', polygon],
]);

export { templateChangeRequest, allActions, featureTypeToInstanceMap, allFeatureTypes, actionToChangeMap };
