import client from 'prom-client';
import { Actions } from '@map-colonies/osm-change-generator';
import jsLogger from '@map-colonies/js-logger';
import { ChangeManager } from '../../../../src/change/models/changeManager';
import { TestDataBuilder } from '../../../common/testDataBuilder';
import { FeatureType } from '../../../../src/change/models/geojsonTypes';
import { allFeatureTypes, getAllFeatureCasesByAction } from '../../../common/constants';
import { ParseOsmElementsError } from '../../../../src/change/models/errors';

let changeManager: ChangeManager;
let testDataBuilder: TestDataBuilder;

describe('ChangeManager', () => {
  beforeAll(function () {
    testDataBuilder = new TestDataBuilder();
  });
  beforeEach(function () {
    changeManager = new ChangeManager(jsLogger({ enabled: false }), new client.Registry());
  });
  describe('#generateChange', () => {
    it.each(allFeatureTypes)('should return a create changeModel with tempOsmId for create action and %s feature', (type: FeatureType) => {
      const action = Actions.CREATE;
      const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
      const { geojson, osmElements, externalId } = request;

      const result = changeManager.generateChange(request.action, geojson, osmElements, externalId);

      // osm change result
      expect(result.change).toMatchObject(expectedChangeResult);

      // full generated change result
      expect(result).toHaveProperty('tempOsmId', -1);
      expect(result).toHaveProperty('action', request.action);
      expect(result).toHaveProperty('externalId', externalId);
    });

    it.each([...getAllFeatureCasesByAction(Actions.MODIFY), ...getAllFeatureCasesByAction(Actions.DELETE)])(
      'should call the correct get change method by %s action and %s feature',
      (action: Actions, type: FeatureType) => {
        const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
        const { geojson, osmElements, externalId } = request;

        const result = changeManager.generateChange(request.action, geojson, osmElements, externalId);

        // osm change result
        expect(result.change).toMatchObject(expectedChangeResult);

        // full generated change result
        expect(result).not.toHaveProperty('tempOsmId');
        expect(result).toHaveProperty('action', action);
        expect(result).toHaveProperty('externalId', externalId);
      }
    );

    it.each(getAllFeatureCasesByAction(Actions.MODIFY))(
      'should throw ParseOsmElementsError if osmElements is empty on modify action and %s feature',
      (action: Actions, type: FeatureType) => {
        const { request } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
        request.osmElements = [];
        const { geojson, osmElements, externalId } = request;

        const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
        expect(generateFunction).toThrow(ParseOsmElementsError);

        const elementType = type === 'Point' ? 'at least one' : 'way';
        const expectedMessage = `Could not parse osm-api-elements, expected ${elementType as string} element`;
        expect(generateFunction).toThrow(expectedMessage);
      }
    );

    it.each(getAllFeatureCasesByAction(Actions.DELETE))(
      'should throw ParseOsmElementsError if osmElements is empty on delete action and %s feature',
      (action: Actions, type: FeatureType) => {
        const { request } = testDataBuilder.setAction(action).setGeojson(type).getTestData();
        request.osmElements = [];
        const { geojson, osmElements, externalId } = request;

        const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
        expect(generateFunction).toThrow(ParseOsmElementsError);

        const expectedMessage = `Could not parse osm-api-elements, expected at least one element`;
        expect(generateFunction).toThrow(expectedMessage);
      }
    );

    it.each([Actions.MODIFY])('should throw ParseOsmElementsError if osmElements is missing node element on %s action', (action: Actions) => {
      const { request } = testDataBuilder.setAction(action).setGeojson('Point').setOsmElements('way').getTestData();

      // remove all the nodes
      request.osmElements = request.osmElements.filter((element) => element.type === 'way');

      const { geojson, osmElements, externalId } = request;

      const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
      expect(generateFunction).toThrow(ParseOsmElementsError);

      const expectedMessage = `Could not parse osm-api-elements, expected node element`;
      expect(generateFunction).toThrow(expectedMessage);
    });

    it.each([Actions.DELETE])('should throw ParseOsmElementsError if osmElements is missing node element on delete action', (action: Actions) => {
      const { request } = testDataBuilder.setAction(action).setGeojson('Point').setOsmElements('way').getTestData();

      // remove all the nodes
      request.osmElements = request.osmElements.filter((element) => element.type === 'way');

      const { geojson, osmElements, externalId } = request;

      const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
      expect(generateFunction).toThrow(ParseOsmElementsError);

      const expectedMessage = `Could not parse osm-api-elements, expected way element`;
      expect(generateFunction).toThrow(expectedMessage);
    });
  });
});
