import { Actions } from '@map-colonies/osm-change-generator';

import { FeatureType } from '../../src/change/models/geojsonTypes';

export type ExtendedFeatureType = FeatureType | '3DPoint' | '3DLineString' | '3DPolygon';

export const externalId = 'some_external_id';

export const allActions: Readonly<Actions[]> = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

export const allFeatureTypes: Readonly<FeatureType[]> = ['Point', 'LineString', 'Polygon'] as const;

export const allExtendedFeatureTypes: Readonly<ExtendedFeatureType[]> = [
  'Point',
  'LineString',
  'Polygon',
  '3DPoint',
  '3DLineString',
  '3DPolygon',
] as const;

export const allExtendedFeatureTypesWith3D = [
  ['Point', false],
  ['3DPoint', true],
  ['LineString', false],
  ['3DLineString', true],
  ['Polygon', false],
  ['3DPolygon', true],
] as [FeatureType, boolean][];

export const getAllFeatureCasesByAction = (action: Actions): [Actions, ExtendedFeatureType, boolean][] =>
  allExtendedFeatureTypesWith3D.map((pair) => [action, pair[0], pair[1]]);

export const allFeaturesOnModifyAndDelete: [Actions, ExtendedFeatureType, boolean][] = [
  ...getAllFeatureCasesByAction(Actions.MODIFY),
  ...getAllFeatureCasesByAction(Actions.DELETE),
];
