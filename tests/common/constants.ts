import { Actions } from '@map-colonies/osm-change-generator';

import { FeatureType } from '../../src/change/models/geojsonTypes';

export type ExtendedFeatureType = FeatureType | '3DPoint' | '3DLineString' | '3DPolygon';

export const externalId = 'some_external_id';

export const allActions: readonly Actions[] = [Actions.CREATE, Actions.MODIFY, Actions.DELETE] as const;

export const allFeatureTypes: readonly FeatureType[] = ['Point', 'LineString', 'Polygon'] as const;

export const allExtendedFeatureTypes: readonly ExtendedFeatureType[] = [
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

export const getAllFeatureCasesByAction = (action: Actions, is3d?: boolean): [Actions, ExtendedFeatureType, boolean][] =>
  is3d === true
    ? allExtendedFeatureTypesWith3D.map((pair) => [action, pair[0], pair[1]])
    : allFeatureTypes.map((feature) => [action, feature, false]);
