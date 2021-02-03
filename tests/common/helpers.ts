import { OsmApiWay, OsmChange, OsmNode, OsmWay } from '@map-colonies/node-osm-elements';

import { FlattenedGeoJSONLine, FlattenedGeoJSONPoint, FlattenedGeoJSONPolygon } from '../../src/change/models/geojsonTypes';
import { OsmApiElements } from '../../src/change/models/helpers';

const TOP_RANDOM_ID = 1000;
const TOP_NUM_OF_NODES_IN_WAY = 10;
const MIN_COORDINATE = -180;
const MAX_COORDINATE = 180;

const getRandom = (top: number): number => {
  return Math.floor(Math.random() * ++top);
};

const generateNodesOfApiWay = (apiWay: OsmApiWay): OsmNode[] => {
  return apiWay.nodes.map<OsmNode>((nodeId) => {
    return {
      type: 'node',
      id: nodeId,
      lat: getRandomCoordinate(),
      lon: getRandomCoordinate(),
    };
  });
};

export const getRandomId = (top = TOP_RANDOM_ID): number => {
  return getRandom(top);
};

export const getRandomCoordinate = (min = MIN_COORDINATE, max = MAX_COORDINATE): number => {
  return Math.random() * (max - min) + min;
};

export const generateEmptyChange = (): Required<OsmChange> => ({
  type: 'osmchange',
  version: '0.6',
  generator: 'some_generator',
  create: [],
  modify: [],
  delete: [],
});

export const generateNode = (): OsmNode => {
  return {
    type: 'node',
    id: getRandomId(),
    lat: getRandomCoordinate(),
    lon: getRandomCoordinate(),
  };
};

export const generateApiWay = (): OsmApiWay => {
  const nodes = Array(TOP_NUM_OF_NODES_IN_WAY).fill(undefined);
  return {
    type: 'way',
    id: getRandomId(),
    nodes: nodes.map((_) => getRandomId()),
  };
};

export const generateWay = (): OsmWay => {
  const apiWay = generateApiWay();
  const nodes = generateNodesOfApiWay(apiWay);
  return {
    ...apiWay,
    nodes,
  };
};

export const generateOsmApiElements = (): OsmApiElements => {
  const apiWay = generateApiWay();
  const nodes = generateNodesOfApiWay(apiWay);
  return [apiWay, ...nodes];
};

export const getRamdomArrayOfCoordinates = (numOfCoordinates = TOP_NUM_OF_NODES_IN_WAY): number[][] => {
  const result: number[][] = [];
  for (let i = 0; i < numOfCoordinates; i++) {
    const lat = getRandomCoordinate();
    const lon = getRandomCoordinate();
    result.push([lat, lon]);
  }
  return result;
};

export const getPoint = (): FlattenedGeoJSONPoint => {
  return { geometry: { type: 'Point', coordinates: [getRandomCoordinate(), getRandomCoordinate()] }, type: 'Feature', properties: { dog: 'meow' } };
};

export const getLine = (): FlattenedGeoJSONLine => {
  return {
    type: 'Feature',
    properties: { dog: 'meow' },
    geometry: {
      type: 'LineString',
      coordinates: getRamdomArrayOfCoordinates(),
    },
  };
};

export const getPolygon = (): FlattenedGeoJSONPolygon => {
  return {
    type: 'Feature',
    properties: { dog: 'meow' },
    geometry: {
      type: 'Polygon',
      coordinates: [getRamdomArrayOfCoordinates()],
    },
  };
};
