import { Actions } from '@map-colonies/osm-change-generator';
import { OsmElementType } from '@map-colonies/node-osm-elements';

import { ChangeManager } from '../../../../src/change/models/changeManager';
import { TestDataBuilder } from '../../../common/testDataBuilder';
import { FeatureType } from '../../../../src/change/models/geojsonTypes';
import { allFeatureTypes } from '../../../common/constants';
import { ParseOsmElementsError } from '../../../../src/change/models/errors';

const getAllFeatureCasesByAction = (action: Actions): [Actions, FeatureType][] => allFeatureTypes.map((featureType) => [action, featureType]);

const caseTable: [Actions, FeatureType][] = [...getAllFeatureCasesByAction(Actions.MODIFY), ...getAllFeatureCasesByAction(Actions.DELETE)];

let changeManager: ChangeManager;
let testDataBuilder: TestDataBuilder;

describe('ChangeManager', () => {
  beforeAll(function () {
    testDataBuilder = new TestDataBuilder();
  });
  beforeEach(function () {
    changeManager = new ChangeManager({ log: jest.fn() });
  });
  describe('#generateChange', () => {
    test.each(getAllFeatureCasesByAction(Actions.CREATE))(
      'should return a create changeModel with tempOsmId',
      (action: Actions, type: FeatureType) => {
        const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
        const { geojson, osmElements, externalId } = request;

        const result = changeManager.generateChange(request.action, geojson, osmElements, externalId);

        // osm change result
        expect(result.change).toMatchObject(expectedChangeResult);

        // full generated change result
        expect(result).toHaveProperty('tempOsmId', -1);
        expect(result).toHaveProperty('action', request.action);
        expect(result).toHaveProperty('externalId', externalId);
      }
    );

    test.each(caseTable)('should call the correct get-changemethod by action and feature type', (action: Actions, type: FeatureType) => {
      const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
      const { geojson, osmElements, externalId } = request;

      const result = changeManager.generateChange(request.action, geojson, osmElements, externalId);

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
