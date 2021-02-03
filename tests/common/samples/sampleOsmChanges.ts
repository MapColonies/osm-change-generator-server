import { OsmChange, OsmNode, OsmWay } from '@map-colonies/node-osm-elements';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';

import { FeatureType } from '../../../src/change/models/geojsonTypes';

interface GeneratedOsmChange {
  action: Actions;
  feature: FeatureType;
  change: OsmChange;
}

type OsmElement = OsmNode | OsmWay;

const createPoint: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [
    {
      id: -1,
      lon: 18,
      lat: 17,
      version: 0,
      type: 'node',
      tags: {
        dog: 'meow',
      },
    },
  ] as OsmElement[],
  modify: [],
  delete: [],
};

const createLineString: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [
    {
      id: -1,
      nodes: [
        { id: -2, lon: 16, lat: 16, version: 0, type: 'node', tags: {} },
        { id: -3, lon: 17, lat: 17, version: 0, type: 'node', tags: {} },
        { id: -4, lon: 18, lat: 18, version: 0, type: 'node', tags: {} },
        { id: -5, lon: 19, lat: 19, version: 0, type: 'node', tags: {} },
      ],
      type: 'way',
      version: 0,
      tags: { dog: 'meow' },
    },
    { id: -2, lon: 16, lat: 16, version: 0, type: 'node', tags: {} },
    { id: -3, lon: 17, lat: 17, version: 0, type: 'node', tags: {} },
    { id: -4, lon: 18, lat: 18, version: 0, type: 'node', tags: {} },
    { id: -5, lon: 19, lat: 19, version: 0, type: 'node', tags: {} },
  ] as OsmElement[],
  modify: [],
  delete: [],
};

const createPolygon: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [
    {
      id: -1,
      nodes: [
        { id: -2, lon: 16, lat: 16, version: 0, type: 'node', tags: {} },
        { id: -3, lon: 17, lat: 17, version: 0, type: 'node', tags: {} },
        { id: -4, lon: 18, lat: 18, version: 0, type: 'node', tags: {} },
        { id: -2, lon: 16, lat: 16, version: 0, type: 'node', tags: {} },
      ],
      type: 'way',
      version: 0,
      tags: { dog: 'meow' },
    },
    { id: -2, lon: 16, lat: 16, version: 0, type: 'node', tags: {} },
    { id: -3, lon: 17, lat: 17, version: 0, type: 'node', tags: {} },
    { id: -4, lon: 18, lat: 18, version: 0, type: 'node', tags: {} },
  ] as OsmElement[],
  modify: [],
  delete: [],
};

const modifyPoint: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [],
  modify: [{ id: 1, lon: 18, lat: 17, type: 'node', tags: { dog: 'meow' } }] as OsmElement[],
  delete: [],
};

const modifyLineString: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [{ id: -1, lon: 19, lat: 19, version: 0, type: 'node', tags: {} }] as OsmElement[],
  modify: [
    {
      id: 1,
      nodes: [
        { id: 2, lon: 16, lat: 16, version: 1, type: 'node', tags: {} },
        { id: 4, lon: 17, lat: 17, version: 1, type: 'node', tags: {} },
        { id: 3, lon: 18, lat: 18, version: 2, type: 'node', tags: {} },
        { id: -1, lon: 19, lat: 19, version: 0, type: 'node', tags: {} },
      ],
      type: 'way',
      version: 3,
      tags: { dog: 'meow' },
    },
  ] as OsmElement[],
  delete: [],
};

const modifyPolygon: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [],
  modify: [
    {
      id: 1,
      nodes: [
        { id: 2, lon: 16, lat: 16, version: 1, type: 'node', tags: {} },
        { id: 4, lon: 17, lat: 17, version: 1, type: 'node', tags: {} },
        { id: 3, lon: 18, lat: 18, version: 2, type: 'node', tags: {} },
        { id: 2, lon: 16, lat: 16, version: 1, type: 'node', tags: {} },
      ],
      type: 'way',
      version: 3,
      tags: { dog: 'meow' },
    },
  ] as OsmElement[],
  delete: [],
};

const deletePoint: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [],
  modify: [],
  delete: [{ type: 'node', id: 1, lat: 18, lon: 17 }] as OsmElement[],
};

const deleteLineString: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [],
  modify: [],
  delete: [
    {
      type: 'way',
      id: 1,
      nodes: [
        { id: 2, lat: 16, lon: 16, type: 'node', version: 1 },
        { id: 3, lat: 18, lon: 18, type: 'node', version: 2 },
        { id: 4, lat: 17, lon: 17, type: 'node', version: 1 },
      ],
      tags: { cat: 'meow' },
      version: 3,
    },
    { id: 2, lat: 16, lon: 16, type: 'node', version: 1 },
    { id: 3, lat: 18, lon: 18, type: 'node', version: 2 },
    { id: 4, lat: 17, lon: 17, type: 'node', version: 1 },
  ] as OsmElement[],
};

const deletePolygon: OsmChange = {
  type: 'osmchange',
  generator: 'osm_change_generator',
  version: '0.6',
  create: [],
  modify: [],
  delete: [
    {
      type: 'way',
      id: 1,
      nodes: [
        { id: 2, lat: 16, lon: 16, type: 'node', version: 1 },
        { id: 3, lat: 18, lon: 18, type: 'node', version: 2 },
        { id: 4, lat: 17, lon: 17, type: 'node', version: 1 },
      ],
      tags: { cat: 'meow' },
      version: 3,
    },
    { id: 2, lat: 16, lon: 16, type: 'node', version: 1 },
    { id: 3, lat: 18, lon: 18, type: 'node', version: 2 },
    { id: 4, lat: 17, lon: 17, type: 'node', version: 1 },
  ] as OsmElement[],
};

const OSM_CHANGE_SAMPLES: GeneratedOsmChange[] = [
  {
    action: Actions.CREATE,
    feature: 'Point',
    change: createPoint,
  },
  {
    action: Actions.CREATE,
    feature: 'LineString',
    change: createLineString,
  },
  {
    action: Actions.CREATE,
    feature: 'Polygon',
    change: createPolygon,
  },
  {
    action: Actions.MODIFY,
    feature: 'Point',
    change: modifyPoint,
  },
  {
    action: Actions.MODIFY,
    feature: 'LineString',
    change: modifyLineString,
  },
  {
    action: Actions.MODIFY,
    feature: 'Polygon',
    change: modifyPolygon,
  },
  {
    action: Actions.DELETE,
    feature: 'Point',
    change: deletePoint,
  },
  {
    action: Actions.DELETE,
    feature: 'LineString',
    change: deleteLineString,
  },
  {
    action: Actions.DELETE,
    feature: 'Polygon',
    change: deletePolygon,
  },
];

export { OSM_CHANGE_SAMPLES };
