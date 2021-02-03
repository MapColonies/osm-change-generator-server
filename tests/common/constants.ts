import { Actions } from '@map-colonies/osm-change-generator/dist/models';

import { FeatureType } from '../../src/change/models/geojsonTypes';

const externalId = 'some_external_id';

const allActions: Readonly<Actions[]> = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

const allFeatureTypes: Readonly<FeatureType[]> = ['Point', 'LineString', 'Polygon'] as const;

export { allActions, allFeatureTypes, externalId };
