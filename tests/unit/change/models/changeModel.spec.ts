import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import * as osmChangeGenerator from '@map-colonies/osm-change-generator';
import { OsmElementType } from '@map-colonies/node-osm-elements';

import * as functions from '../../../../src/change/models/changeManager';
import { ChangeManager } from '../../../../src/change/models/changeManager';
import { TestDataBuilder } from '../../../common/testDataBuilder';
import { FeatureType } from '../../../../src/change/models/geojsonTypes';
import { allFeatureTypes } from '../../../common/constants';
import { ParseOsmElementsError } from '../../../../src/change/models/errors';
import { osmElementsMap, OsmApiToElement } from '../../../common/samples/sampleData';

interface ICustomSpies {
  getChange: jest.SpyInstance;
  getElement: jest.SpyInstance;
}

const getAllFeatureCasesByAction = (action: Actions): [Actions, FeatureType][] => allFeatureTypes.map((featureType) => [action, featureType]);

const caseTable: [Actions, FeatureType][] = [...getAllFeatureCasesByAction(Actions.MODIFY), ...getAllFeatureCasesByAction(Actions.DELETE)];

let changeManager: ChangeManager;
let testDataBuilder: TestDataBuilder;
let featureToSpiesMap: Map<FeatureType, ICustomSpies>;

describe('ChangeManager', () => {
  beforeAll(function () {
    testDataBuilder = new TestDataBuilder();

    const getChangeFromPointSpy = jest.spyOn(osmChangeGenerator, 'getChangeFromPoint');
    const getChangeFromLineSpy = jest.spyOn(osmChangeGenerator, 'getChangeFromLine');
    const getChangeFromPolygonSpy = jest.spyOn(osmChangeGenerator, 'getChangeFromPolygon');
    const getNodeSpy = jest.spyOn(functions, 'getNodeFromElements');
    const getWaySpy = jest.spyOn(functions, 'getOsmWayFromElements');

    featureToSpiesMap = new Map<FeatureType, ICustomSpies>([
      ['Point', { getChange: getChangeFromPointSpy, getElement: getNodeSpy }],
      ['LineString', { getChange: getChangeFromLineSpy, getElement: getWaySpy }],
      ['Polygon', { getChange: getChangeFromPolygonSpy, getElement: getWaySpy }],
    ]);
  });
  beforeEach(function () {
    changeManager = new ChangeManager({ log: jest.fn() });
  });
  afterEach(function () {
    jest.clearAllMocks();
  });
  describe('#generateChange', () => {
    test.each(getAllFeatureCasesByAction(Actions.CREATE))(
      'should return a create changeModel with tempOsmId',
      (action: Actions, type: FeatureType) => {
        const tempOsmIdSpy = jest.spyOn(functions, 'getTempOsmId');
        const { getChange, getElement } = featureToSpiesMap.get(type) as ICustomSpies;
        const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
        const { geojson, osmElements, externalId } = request;

        const result = changeManager.generateChange(request.action, geojson, osmElements, externalId);

        // spies
        expect(getElement).not.toHaveBeenCalled();
        expect(getChange).toHaveBeenCalledWith({ action: action, feature: geojson });
        expect(tempOsmIdSpy).toHaveBeenCalled();

        // osm change result
        expect(result.change).toMatchObject(expectedChangeResult);

        // full generated change result
        expect(result).toHaveProperty('tempOsmId', -1);
        expect(result).toHaveProperty('action', request.action);
        expect(result).toHaveProperty('externalId', externalId);
      }
    );

    test.each(caseTable)('should call the correct get-changemethod by action and feature type', (action: Actions, type: FeatureType) => {
      const tempOsmIdSpy = jest.spyOn(functions, 'getTempOsmId');
      const { getChange, getElement } = featureToSpiesMap.get(type) as ICustomSpies;
      const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
      const { geojson, osmElements, externalId } = request;

      const result = changeManager.generateChange(request.action, geojson, osmElements, externalId);

      // spies
      expect(getElement).toHaveBeenCalledWith(osmElements);
      expect(tempOsmIdSpy).not.toHaveBeenCalled();

      const elementType: OsmElementType = type === 'Point' ? 'node' : 'way';
      const oldElement = (osmElementsMap.get(elementType) as OsmApiToElement).element;
      if (action === Actions.MODIFY) {
        expect(getChange).toHaveBeenCalledWith({ action: action, feature: geojson, oldElement: oldElement });
      } else {
        expect(getChange).toHaveBeenCalledWith({ action: action, oldElement: oldElement });
      }

      // osm change result
      expect(result.change).toMatchObject(expectedChangeResult);

      // full generated change result
      expect(result).not.toHaveProperty('tempOsmId');
      expect(result).toHaveProperty('action', action);
      expect(result).toHaveProperty('externalId', externalId);
    });

    test.each(caseTable)('should throw ParseOsmElementsError if osmElements is empty on modify and delete', (action: Actions, type: FeatureType) => {
      const { request } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
      request.osmElements = [];
      const { geojson, osmElements, externalId } = request;

      const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
      expect(generateFunction).toThrow(ParseOsmElementsError);

      const elementType: OsmElementType = type === 'Point' ? 'node' : 'way';
      const expectedMessage = `Could not parse osm-api-elements, expected ${elementType as string} element`;
      expect(generateFunction).toThrow(expectedMessage);
    });

    it('should throw ParseOsmElementsError if osmElements is missing node element on modify and delete', function () {
      [Actions.MODIFY, Actions.DELETE].forEach((action) => {
        const { request } = testDataBuilder.setAction(action).setGeojson('Point').setOsmElements('way').getTestData();
        request.osmElements = request.osmElements.filter((element) => element.type === 'way');
        const { geojson, osmElements, externalId } = request;

        const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
        expect(generateFunction).toThrow(ParseOsmElementsError);

        const elementType: OsmElementType = 'node';
        const expectedMessage = `Could not parse osm-api-elements, expected ${elementType as string} element`;
        expect(generateFunction).toThrow(expectedMessage);
      });
    });
  });
});
