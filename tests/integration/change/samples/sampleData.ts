/* eslint-disable @typescript-eslint/no-magic-numbers */ // used only for sample data
import { OsmNode, OsmElementType } from '@map-colonies/node-osm-elements';
import {
  FeatureType,
  FlattenedGeoJSON,
  FlattenedGeoJSONLine,
  FlattenedGeoJSONPoint,
  FlattenedGeoJSONPolygon,
} from '../../../../src/change/models/geojsonTypes';
import { OsmApiElements } from '../../../../src/change/models/helpers';

const getPoint = (): FlattenedGeoJSONPoint => {
  return { geometry: { type: 'Point', coordinates: [18, 17] }, type: 'Feature', properties: { dog: 'meow' } };
};

const getLine = (): FlattenedGeoJSONLine => {
  return {
    geometry: {
      type: 'LineString',
      coordinates: [
        [16, 16],
        [17, 17],
        [18, 18],
        [19, 19],
      ],
    },
    type: 'Feature',
    properties: { dog: 'meow' },
  };
};

const getPolygon = (): FlattenedGeoJSONPolygon => {
  return {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [16, 16],
          [17, 17],
          [18, 18],
          [16, 16],
        ],
      ],
    },
    type: 'Feature',
    properties: { dog: 'meow' },
  };
};

const osmApiElements: OsmApiElements = [
  {
    id: 2,
    lat: 16,
    lon: 16,
    type: 'node',
    version: 1,
  },
  {
    id: 3,
    lat: 18,
    lon: 18,
    type: 'node',
    version: 2,
  },
  {
    id: 4,
    lat: 17,
    lon: 17,
    type: 'node',
    version: 1,
  },
  {
    type: 'way',
    id: 1,
    nodes: [2, 3, 4],
    tags: {
      cat: 'meow',
    },
    version: 3,
  },
];

const node: OsmNode = {
  type: 'node',
  id: 1,
  lat: 18,
  lon: 17,
};

const osmElementsMap = new Map<OsmElementType, OsmApiElements>([
  ['node', [node]],
  ['way', osmApiElements],
]);

const getFeatureMap = (): Map<FeatureType, FlattenedGeoJSON> => {
  return new Map<FeatureType, FlattenedGeoJSON>([
    ['Point', getPoint()],
    ['LineString', getLine()],
    ['Polygon', getPolygon()],
  ]);
};

export { osmElementsMap, getFeatureMap };
