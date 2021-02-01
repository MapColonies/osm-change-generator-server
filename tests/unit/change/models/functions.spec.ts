import { BaseElement, OsmChange, OsmElementType, parseOsmWayApi } from '@map-colonies/node-osm-elements';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import * as osmChangeGenerator from '@map-colonies/osm-change-generator';
import { ParseOsmElementsError } from '../../../../src/change/models/errors';
import {
  getNodeFromElements,
  getTempOsmId,
  throwParseOsmElementsError,
  isOsmChangeValid,
  getOsmWayFromElements,
  generateChange,
} from '../../../../src/change/models/functions';
import { OsmApiElements } from '../../../../src/change/models/helpers';
import { FeatureType, FlattenedGeoJSON } from '../../../../src/change/models/geojsonTypes';
import * as util from '../../../../src/common/util';
import * as functions from '../../../../src/change/models/functions';
import { generateEmptyChange, generateApiWay, generateNode, generateOsmApiElements, generateWay, ICustomSpies } from './helpers';
import { allActions, allFeatureTypes, featureTypeToInstanceMap } from './constants';

let map: Map<FeatureType, ICustomSpies>;

afterEach(() => {
  jest.restoreAllMocks();
});
describe('functions', function () {
  describe('#getTempOsmId', function () {
    it('should return the osm id of the only node in the array', function () {
      const node = generateNode();
      const data = [node];
      const tempOsmId = getTempOsmId(data);
      expect(tempOsmId).toEqual(node.id);
    });

    it('should return the osm id of the only way in the array', function () {
      const way = generateWay();
      const data = [generateNode(), way, generateNode(), generateNode()];
      const tempOsmId = getTempOsmId(data);
      expect(tempOsmId).toEqual(way.id);
    });
  });

  describe('#throwParseOsmElementsError', function () {
    it('should throw an ParseOsmelementsError with the passed element in the message', function () {
      const types: OsmElementType[] = ['node', 'way', 'relation'];
      types.forEach((elementType) => {
        const expectedMessage = `Could not parse osm-api-elements, expected ${elementType as string} element`;
        expect(() => throwParseOsmElementsError(elementType)).toThrow(ParseOsmElementsError);
        expect(() => throwParseOsmElementsError(elementType)).toThrow(expectedMessage);
      });
    });
  });

  describe('#isOsmChangeValid', function () {
    it('should return the result of validateArrayHasElements', function () {
      jest.mock('../../../../src/common/util', () => ({
        validateArrayHasElements: jest.fn(),
      }));
      let mockValidateArrayHasElements: jest.SpyInstance;
      let calls = 0;

      const callIsOsmChangeValid = (action: Actions, osmChange: OsmChange, result: boolean): void => {
        expect(isOsmChangeValid(action, osmChange)).toEqual(result);
        expect(mockValidateArrayHasElements).toHaveBeenCalledTimes(++calls);
      };

      const osmChange = generateEmptyChange();
      const results: Readonly<boolean[]> = [true, false] as const;

      results.forEach((result) => {
        mockValidateArrayHasElements = jest.spyOn(util, 'validateArrayHasElements').mockReturnValue(result);
        allActions.forEach((action) => callIsOsmChangeValid(action, osmChange, result));
      });
    });
  });

  describe('#getNodeFromElements', function () {
    it('should get the only OsmNode from array of elements or the first', function () {
      const node = generateNode();
      const elements = [node];
      expect(getNodeFromElements(elements)).toBe(node);
      elements.push(generateNode());
      expect(getNodeFromElements(elements)).toBe(node);
    });

    it('should throw ParseOsmElementsError if array is empty', function () {
      const elements: OsmApiElements = [];
      expect(() => getNodeFromElements(elements)).toThrow(ParseOsmElementsError);
    });

    it('should throw ParseOsmElementsError if array has no nodes', function () {
      const elements: OsmApiElements = [generateApiWay()];
      expect(() => getNodeFromElements(elements)).toThrow(ParseOsmElementsError);
    });
  });

  describe('#getOsmWayFromElements', function () {
    it('should get the only OsmWay from array of elements', function () {
      const elements = generateOsmApiElements();
      const osmWay = parseOsmWayApi(elements);
      const result = getOsmWayFromElements(elements);
      expect(result).toEqual(osmWay);
    });

    it('should throw ParseOsmElementsError if array is empty', function () {
      const elements: OsmApiElements = [];
      expect(() => getOsmWayFromElements(elements)).toThrow(ParseOsmElementsError);
    });

    it('should throw ParseOsmElementsError if array has no osmway', function () {
      const elements: OsmApiElements = [generateNode()];
      expect(() => getOsmWayFromElements(elements)).toThrow(ParseOsmElementsError);
    });
  });

  describe('#generateChange', function () {
    beforeEach(() => {
      const getChangeFromPointSpy = jest.spyOn(osmChangeGenerator, 'getChangeFromPoint');
      const getChangeFromLineSpy = jest.spyOn(osmChangeGenerator, 'getChangeFromLine');
      const getChangeFromPolygonSpy = jest.spyOn(osmChangeGenerator, 'getChangeFromPolygon');
      const mockGetNode = jest.spyOn(functions, 'getNodeFromElements');
      const mockGetWay = jest.spyOn(functions, 'getOsmWayFromElements');

      map = new Map<FeatureType, ICustomSpies>([
        ['Point', { getChange: getChangeFromPointSpy, getElement: mockGetNode }],
        ['LineString', { getChange: getChangeFromLineSpy, getElement: mockGetWay }],
        ['Polygon', { getChange: getChangeFromPolygonSpy, getElement: mockGetWay }],
      ]);
    });
    test.each(allFeatureTypes.map((type) => [type]))('should call the correct get-changemethod by action and feature type', (type: FeatureType) => {
      const feature = featureTypeToInstanceMap.get(type) as FlattenedGeoJSON;
      const mocks = map.get(type) as ICustomSpies;
      const getChangeSpy = mocks.getChange;
      const mockGetElementFromElements = mocks.getElement;

      let oldElement: BaseElement;
      if (type === 'Point') {
        oldElement = generateNode();
      } else {
        oldElement = generateWay();
      }
      mockGetElementFromElements.mockReturnValue(oldElement);

      allActions.forEach((action) => {
        generateChange(action, feature, generateOsmApiElements());
        switch (action) {
          case Actions.CREATE: {
            expect(mockGetElementFromElements).not.toHaveBeenCalled();
            expect(getChangeSpy).toHaveBeenCalledWith({ action, feature });
            break;
          }
          case Actions.MODIFY: {
            expect(mockGetElementFromElements).toHaveBeenCalled();
            expect(getChangeSpy).toHaveBeenCalledWith({ action, feature, oldElement });
            break;
          }
          case Actions.DELETE: {
            expect(mockGetElementFromElements).toHaveBeenCalled();
            expect(getChangeSpy).toHaveBeenCalledWith({ action, oldElement });
            break;
          }
        }
      });
    });
  });
});
