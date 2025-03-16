import { type FlattenedGeoJSONPoint, type FlattenedGeoJSONLine, type FlattenedGeoJSONPolygon } from '@map-colonies/osm-change-generator';
import { type Feature, type Geometry } from 'geojson';

export type FeatureType = 'Point' | 'LineString' | 'Polygon';
export type FlattenOptionalGeometry = Omit<Feature, 'geometry'> & { geometry?: Geometry };
export type FlattenedGeoJSON = FlattenedGeoJSONPoint | FlattenedGeoJSONLine | FlattenedGeoJSONPolygon;
