import { Actions } from '@map-colonies/osm-change-generator';

import { FeatureType } from '../../src/change/models/geojsonTypes';

const externalId = 'some_external_id';

const allActions: Readonly<Actions[]> = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

const allFeatureTypes: Readonly<FeatureType[]> = ['Point', 'LineString', 'Polygon'] as const;

const getAllFeatureCasesByAction = (action: Actions): [Actions, FeatureType][] => allFeatureTypes.map((featureType) => [action, featureType]);

const allFeaturesOnModifyAndDelete: [Actions, FeatureType][] = [
  ...getAllFeatureCasesByAction(Actions.MODIFY),
  ...getAllFeatureCasesByAction(Actions.DELETE),
];

export { allActions, allFeatureTypes, externalId, allFeaturesOnModifyAndDelete };
