/* eslint-disable no-fallthrough */ // the rule is not typescript aware in this case
import { inject, injectable } from 'tsyringe';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import { parseOsmWayApi, BaseElement, OsmNode, OsmWay, OsmChange, OsmElementType } from '@map-colonies/node-osm-elements';
import { getChangeFromPoint, getChangeFromLine, getChangeFromPolygon } from '@map-colonies/osm-change-generator';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { validateArrayIsNotEmpty } from '../../common/util';
import { FlattenedGeoJSON, FlattenedGeoJSONPoint, FlattenedGeoJSONLine, FlattenedGeoJSONPolygon } from './geojsonTypes';
import { ChangeModel } from './change';
import { ParseOsmElementsError, GeneratedOsmChangeInvalidError } from './errors';
import { isNode, isWay, OsmApiElements } from './helpers';

@injectable()
export class ChangeManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}
  public handle(action: Actions, geojson: FlattenedGeoJSON, osmElements: OsmApiElements, externalId: string): ChangeModel {
    const osmChange = this.generateChange(action, geojson, osmElements);
    if (this.validateOsmChange(action, osmChange)) {
      throw new GeneratedOsmChangeInvalidError('generated osm-change is invalid.');
    }
    let changeModel: ChangeModel = {
      action,
      change: osmChange,
      externalId,
    };
    if (action === Actions.CREATE && osmChange.create) {
      const tempOsmId = this.getTempOsmId(osmChange.create);
      changeModel = {
        ...changeModel,
        tempOsmId,
      };
    }
    return changeModel;
  }

  private generateChange(action: Actions, feature: FlattenedGeoJSON, osmElements: OsmApiElements): OsmChange {
    switch (feature.geometry.type) {
      case 'Point': {
        feature = feature as FlattenedGeoJSONPoint;
        switch (action) {
          case Actions.CREATE: {
            return getChangeFromPoint({ action, feature });
          }
          case Actions.MODIFY: {
            const oldElement = this.getNodeFromElements(osmElements);
            return getChangeFromPoint({ action, feature, oldElement });
          }
          case Actions.DELETE: {
            const oldElement = this.getNodeFromElements(osmElements);
            return getChangeFromPoint({ action, oldElement });
          }
        }
      }
      case 'LineString': {
        feature = feature as FlattenedGeoJSONLine;
        switch (action) {
          case Actions.CREATE: {
            return getChangeFromLine({ action, feature });
          }
          case Actions.MODIFY: {
            const oldElement = this.getOsmWayFromElements(osmElements);
            return getChangeFromLine({ action, feature, oldElement });
          }
          case Actions.DELETE: {
            const oldElement = this.getOsmWayFromElements(osmElements);
            return getChangeFromLine({ action, oldElement });
          }
        }
      }
      case 'Polygon': {
        feature = feature as FlattenedGeoJSONPolygon;
        switch (action) {
          case Actions.CREATE: {
            return getChangeFromPolygon({ action, feature });
          }
          case Actions.MODIFY: {
            const oldElement = this.getOsmWayFromElements(osmElements);
            return getChangeFromPolygon({ action, feature, oldElement });
          }
          case Actions.DELETE: {
            const oldElement = this.getOsmWayFromElements(osmElements);
            return getChangeFromPolygon({ action, oldElement });
          }
        }
      }
    }
  }
  private getNodeFromElements(elements: OsmApiElements): OsmNode {
    if (elements.length === 0) {
      this.throwParseOsmElementsError('node');
    }
    const node = elements[0];
    if (!isNode(node)) {
      this.throwParseOsmElementsError('node');
    }
    return node;
  }

  private getOsmWayFromElements(elements: OsmApiElements): OsmWay {
    const osmWay = parseOsmWayApi(elements);
    if (osmWay === undefined) {
      this.throwParseOsmElementsError('way');
    }
    return osmWay;
  }

  private getTempOsmId(elements: BaseElement[]): number {
    if (elements.length === 1) {
      return elements[0].id;
    }
    const way = elements.find(isWay);
    return (way as OsmWay).id;
  }

  private throwParseOsmElementsError(elementType: OsmElementType): never {
    throw new ParseOsmElementsError(`Could not parse osm-api-elements, expected ${elementType as string} element`);
  }

  private validateOsmChange(action: Actions, osmChange: OsmChange): boolean {
    if (action === Actions.CREATE) {
      return validateArrayIsNotEmpty(osmChange.create);
    }
    if (action === Actions.MODIFY) {
      return validateArrayIsNotEmpty(osmChange.modify);
    }
    return validateArrayIsNotEmpty(osmChange.delete);
  }
}
