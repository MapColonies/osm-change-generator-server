/* eslint-disable @typescript-eslint/no-magic-numbers */ // used only for sample data
import { OsmNode, OsmElementType, BaseElement, OsmWay } from '@map-colonies/node-osm-elements';
import { FlattenedGeoJSONLine, FlattenedGeoJSONPoint, FlattenedGeoJSONPolygon } from '@map-colonies/osm-change-generator';
import { FlattenedGeoJSON } from '../../../src/change/models/geojsonTypes';
import { OsmApiElements } from '../../../src/change/models/helpers';
import { ExtendedFeatureType } from '../constants';

const getPoint = (): FlattenedGeoJSONPoint => {
  return { geometry: { type: 'Point', coordinates: [18, 17] }, type: 'Feature', properties: { dog: 'meow' } };
};

const get3DPoint = (): FlattenedGeoJSONPoint => {
  return { geometry: { type: 'Point', coordinates: [18, 17, 1.1] }, type: 'Feature', properties: { dog: 'meow' } };
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

const get3DLine = (): FlattenedGeoJSONLine => {
  return {
    geometry: {
      type: 'LineString',
      coordinates: [
        [16, 16, 1.1],
        [17, 17, 2.2],
        [18, 18, 3.3],
        [19, 19, 4.4],
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

const get3DPolygon = (): FlattenedGeoJSONPolygon => {
  return {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [16, 16, 1.1],
          [17, 17, 2.2],
          [18, 18, 3.3],
          [16, 16, 1.1],
        ],
      ],
    },
    type: 'Feature',
    properties: { dog: 'meow' },
  };
};

const sampleOsmApiElements: OsmApiElements = [
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

const sampleNode: OsmNode = {
  type: 'node',
  id: 1,
  lat: 18,
  lon: 17,
};

const sampleOsmWay: OsmWay = {
  type: 'way',
  id: 1,
  nodes: [
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
  ],
  tags: {
    cat: 'meow',
  },
  version: 3,
};

interface OsmApiToElement {
  apiElements: OsmApiElements;
  element: BaseElement;
}

const osmElementsMap = new Map<OsmElementType, OsmApiToElement>([
  ['node', { apiElements: [sampleNode], element: sampleNode }],
  ['way', { apiElements: sampleOsmApiElements, element: sampleOsmWay }],
]);

const getFeatureMap = (): Map<ExtendedFeatureType, FlattenedGeoJSON> => {
  return new Map<ExtendedFeatureType, FlattenedGeoJSON>([
    ['Point', getPoint()],
    ['3DPoint', get3DPoint()],
    ['LineString', getLine()],
    ['3DLineString', get3DLine()],
    ['Polygon', getPolygon()],
    ['3DPolygon', get3DPolygon()],
  ]);
};

export { type OsmApiToElement, osmElementsMap, getFeatureMap };
