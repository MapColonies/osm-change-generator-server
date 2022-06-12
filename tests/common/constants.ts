import { Actions } from '@map-colonies/osm-change-generator';

import { FeatureType } from '../../src/change/models/geojsonTypes';

export const externalId = 'some_external_id';

export const allActions: Readonly<Actions[]> = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

export const allFeatureTypes: Readonly<FeatureType[]> = ['Point', 'LineString', 'Polygon'] as const;

export const getAllFeatureCasesByAction = (action: Actions): [Actions, FeatureType][] => allFeatureTypes.map((featureType) => [action, featureType]);

export const allFeaturesOnModifyAndDelete: [Actions, FeatureType][] = [
  ...getAllFeatureCasesByAction(Actions.MODIFY),
  ...getAllFeatureCasesByAction(Actions.DELETE),
];
