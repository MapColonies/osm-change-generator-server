import { Actions } from '@map-colonies/osm-change-generator';
import jsLogger from '@map-colonies/js-logger';
import { configMock } from '@tests/common/helpers';
import { ChangeManager } from '../../../../src/change/models/changeManager';
import { TestDataBuilder } from '../../../common/testDataBuilder';
import { allExtendedFeatureTypesWith3D, ExtendedFeatureType, getAllFeatureCasesByAction } from '../../../common/constants';
import { ParseOsmElementsError } from '../../../../src/change/models/errors';

let changeManager: ChangeManager;
let changeManagerWithLOD2: ChangeManager;
let testDataBuilder: TestDataBuilder;

describe('ChangeManager', () => {
  beforeAll(function () {
    changeManager = new ChangeManager(jsLogger({ enabled: false }), configMock({ shouldHandleLOD2: false }));
    changeManagerWithLOD2 = new ChangeManager(jsLogger({ enabled: false }), configMock({ shouldHandleLOD2: true }));

    testDataBuilder = new TestDataBuilder();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    testDataBuilder.reset();
  });

  describe('#generateChange', () => {
    it.each(allExtendedFeatureTypesWith3D)(
      'should return a create changeModel with tempOsmId for create action and %s feature',
      (type: ExtendedFeatureType, is3d: boolean) => {
        const action = Actions.CREATE;
        const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).setIs3D(is3d).getTestData();
        const { geojson, osmElements, externalId } = request;

        const contextChangeManager: ChangeManager = is3d ? changeManagerWithLOD2 : changeManager;
        const result = contextChangeManager.generateChange(request.action, geojson, osmElements, externalId);

        // osm change result
        expect(result.change).toMatchObject(expectedChangeResult);

        // full generated change result
        expect(result).toHaveProperty('tempOsmId', -1);
        expect(result).toHaveProperty('action', request.action);
        expect(result).toHaveProperty('externalId', externalId);
      }
    );

    it.each([...getAllFeatureCasesByAction(Actions.MODIFY)])(
      'should call the correct get change method by %s action and %s feature',
      (action: Actions, type: ExtendedFeatureType, is3d: boolean) => {
        const { request, expectedResult: expectedChangeResult } = testDataBuilder.setAction(action).setGeojson(type).setIs3D(is3d).getTestData();
        const { geojson, osmElements, externalId } = request;

        const contextChangeManager: ChangeManager = is3d ? changeManagerWithLOD2 : changeManager;
        const result = contextChangeManager.generateChange(request.action, geojson, osmElements, externalId);

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
      (action: Actions, type: ExtendedFeatureType, is3d: boolean) => {
        const { request } = testDataBuilder.setAction(action).setGeojson(type).setIs3D(is3d).getTestData();
        request.osmElements = [];
        const { geojson, osmElements, externalId } = request;

        const generateFunction = () => changeManager.generateChange(request.action, geojson, osmElements, externalId);
        expect(generateFunction).toThrow(ParseOsmElementsError);

        const elementType = type === 'Point' || type === '3DPoint' ? 'at least one' : 'way';
        const expectedMessage = `Could not parse osm-api-elements, expected ${elementType as string} element`;
        expect(generateFunction).toThrow(expectedMessage);
      }
    );

    it.each(getAllFeatureCasesByAction(Actions.DELETE))(
      'should throw ParseOsmElementsError if osmElements is empty on delete action and %s feature',
      (action: Actions, type: ExtendedFeatureType, is3d: boolean) => {
        const { request } = testDataBuilder.setAction(action).setGeojson(type).setIs3D(is3d).getTestData();
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
