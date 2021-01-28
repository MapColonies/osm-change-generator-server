import { BaseElement, OsmApiWay, OsmNode, OsmWay } from '@map-colonies/node-osm-elements';

export type OsmApiElements = (OsmApiWay | OsmNode)[];

export const isNode = (element: BaseElement): element is OsmNode => element.type === 'node';
export const isWay = (element: BaseElement): element is OsmWay => element.type === 'way';
