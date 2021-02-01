import { Feature, LineString, Point, Polygon } from 'geojson';

type Tags = Record<string, string> | undefined;

export type FeatureType = 'Point' | 'LineString' | 'Polygon';
export type FlattenedGeoJSONPoint = Feature<Point, Tags>;
export type FlattenedGeoJSONLine = Feature<LineString, Tags>;
export type FlattenedGeoJSONPolygon = Feature<Polygon, Tags>;
export type FlattenedGeoJSON = FlattenedGeoJSONPoint | FlattenedGeoJSONLine | FlattenedGeoJSONPolygon;
