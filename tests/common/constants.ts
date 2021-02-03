import { OsmChange, OsmWay } from '@map-colonies/node-osm-elements';
import { getChangeFromLine } from '@map-colonies/osm-change-generator';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';

import { FeatureType, FlattenedGeoJSON } from '../../src/change/models/geojsonTypes';
import { generateOsmApiElements, generateWay, getLine, getPoint, getPolygon } from '../unit/change/models/helpers';

const externalId = 'some_external_id';

const allActions: Readonly<Actions[]> = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

const allFeatureTypes: Readonly<FeatureType[]> = ['Point', 'LineString', 'Polygon'] as const;

const oldElement: OsmWay = generateWay();

const createChange = getChangeFromLine({ action: Actions.CREATE, feature: getLine() });
const modifyChange = getChangeFromLine({ action: Actions.MODIFY, feature: getLine(), oldElement });
const deleteChange = getChangeFromLine({ action: Actions.DELETE, oldElement });

const actionToChangeMap = new Map<Actions, OsmChange>([
  [Actions.CREATE, createChange],
  [Actions.MODIFY, modifyChange],
  [Actions.DELETE, deleteChange],
]);

const templateChangeRequest = {
  externalId,
  osmElements: generateOsmApiElements(),
  geojson: getLine(),
};

const featureTypeToInstanceMap = new Map<FeatureType, FlattenedGeoJSON>([
  ['Point', getPoint()],
  ['LineString', getLine()],
  ['Polygon', getPolygon()],
]);

export { templateChangeRequest, allActions, featureTypeToInstanceMap, allFeatureTypes, actionToChangeMap, externalId };
