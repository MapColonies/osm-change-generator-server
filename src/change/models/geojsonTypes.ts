import { FlattenedGeoJSONPoint, FlattenedGeoJSONLine, FlattenedGeoJSONPolygon } from '@map-colonies/osm-change-generator';

export type FeatureType = 'Point' | 'LineString' | 'Polygon';
export type FlattenedGeoJSON = FlattenedGeoJSONPoint | FlattenedGeoJSONLine | FlattenedGeoJSONPolygon;
