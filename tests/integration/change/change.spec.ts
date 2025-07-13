import { Application } from 'express';
import httpStatusCodes from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { Actions } from '@map-colonies/osm-change-generator';
import { DependencyContainer } from 'tsyringe';
import { SERVICES } from '@src/common/constants';
import { getApp } from '@src/app';
import { configMock } from '@tests/common/helpers';
import { ExtendedFeatureType, allExtendedFeatureTypesWith3D, allFeatureTypes, getAllFeatureCasesByAction } from '../../common/constants';
import { FeatureType, FlattenedGeoJSON } from '../../../src/change/models/geojsonTypes';
import { ChangeModel } from '../../../src/change/models/change';
import { ChangeRequestBody } from '../../../src/change/controllers/changeController';
import { TestDataBuilder } from '../../common/testDataBuilder';
import { ChangeRequestSender } from './helpers/requestSender';

let testDataBuilder: TestDataBuilder;
let app: Application;
let container: DependencyContainer;
let requestSender: ChangeRequestSender;

describe('changeWithout3D', function () {
  beforeAll(async function () {
    const [initializedApp, initializedContainer] = await getApp({
      override: [
        {
          token: SERVICES.CONFIG,
          provider: { useValue: configMock({ shouldHandleLOD2: false }) },
        },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        {
          token: SERVICES.TRACER,
          provider: {
            useValue: trace.getTracer('test-tracer'),
          },
        },
      ],
      useChild: true,
    });

    app = initializedApp;
    container = initializedContainer;

    requestSender = new ChangeRequestSender(app);

    testDataBuilder = new TestDataBuilder();
  });

  afterEach(function () {
    jest.resetAllMocks();
    testDataBuilder.reset();
  });

  afterAll(function () {
    container.reset();
  });

  describe('POST /change', function () {
    describe('Happy Path 😸', function () {
      it.each(allFeatureTypes)(
        'should return 201 status code and the change generated that was invoked by create action and %s feature',
        async (feature: ExtendedFeatureType) => {
          const action = Actions.CREATE;
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(false).getTestData();
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).toHaveProperty('tempOsmId');
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each([...getAllFeatureCasesByAction(Actions.MODIFY, false), ...getAllFeatureCasesByAction(Actions.DELETE, false)])(
        'should return 201 status code and the change generated that was invoked by %s action and %s feature',
        async (action: Actions, feature: ExtendedFeatureType, is3d: boolean) => {
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).not.toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each(getAllFeatureCasesByAction(Actions.DELETE, false))(
        'should return 201 status code and the delete change generated that was invoked by %s action and %s feature with no geomerty on request',
        async (action: Actions, feature: ExtendedFeatureType, is3d: boolean) => {
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const { geometry, ...geojsonWithoutGeometry } = request.geojson;
          const response = await requestSender.postChange({ ...request, geojson: geojsonWithoutGeometry } as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).not.toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each(allFeatureTypes)(
        'should return 201 status code on create action and %s feature when osmElements is missing on the request',
        async (feature: FeatureType) => {
          const action = Actions.CREATE;
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(false).getTestData();
          const { osmElements, ...rest } = request;
          const response = await requestSender.postChange(rest as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', rest.externalId);
          expect(response.body).toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each(allFeatureTypes)(
        'should return 201 status code on create action and %s feature when osmElements is empty on the request',
        async (feature: FeatureType) => {
          const action = Actions.CREATE;
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(false).getTestData();
          request.osmElements = [];
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it('should not fail if geojson geometry type is not one of the valid FeatureType on delete request', async function () {
        const request = testDataBuilder.setAction(Actions.DELETE).setGeojson('Point').getResult();
        (request.geojson as FlattenedGeoJSON).geometry.type = 'non_valid_type' as FeatureType;

        const response = await requestSender.postChange(request);

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe('Bad Path 🙀', function () {
      it('should return 400 if externalId is missing', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Polygon').getResult();
        const { externalId, ...rest } = request;
        const response = await requestSender.postChange(rest as ChangeRequestBody);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });

      it('should return 400 if action is not one of the valid Actions', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Polygon').getResult();
        request.action = 'non_valid_action' as Actions;
        const response = await requestSender.postChange(request);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });

      it('should return 400 if geojson is missing', async function () {
        const request = testDataBuilder.setAction(Actions.MODIFY).setGeojson('LineString').getResult();
        const { geojson, ...rest } = request;

        const response = await requestSender.postChange(rest as ChangeRequestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });

      it('should return 400 if point geojson geometry coordinates has fewer coordinates than 2', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Point').getResult();
        (request.geojson as FlattenedGeoJSON).geometry.coordinates = [1];

        const response = await requestSender.postChange(request);
        const message = (response.body as { message: string }).message;

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(message).toContain('request/geojson/geometry/coordinates must NOT have fewer than 2 items');
      });

      it('should return 400 if point geojson geometry coordinates has more coordinates than 3', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Point').getResult();
        (request.geojson as FlattenedGeoJSON).geometry.coordinates = [1, 2, 3, 4];

        const response = await requestSender.postChange(request);
        const message = (response.body as { message: string }).message;

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(message).toContain('request/geojson/geometry/coordinates must NOT have more than 3 items');
      });

      it.each([...getAllFeatureCasesByAction(Actions.CREATE), ...getAllFeatureCasesByAction(Actions.MODIFY)])(
        'should return 400 status code and error message on %s action and %s feature if geometry is missing',
        async (action: Actions, feature: ExtendedFeatureType, is3d: boolean) => {
          const { request } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const { geometry, ...geojsonWithoutGeometry } = request.geojson;
          const response = await requestSender.postChange({ ...request, geojson: geojsonWithoutGeometry } as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
          const message = (response.body as { message: string }).message;
          expect(message).toContain("request/geojson must have required property 'geometry'");
        }
      );
    });

    describe('Sad Path 😿', function () {
      it.each(getAllFeatureCasesByAction(Actions.MODIFY))(
        'should return 422 status code and error message indicating missing element on %s action and %s feature',
        async (action: Actions, feature: ExtendedFeatureType) => {
          const request = testDataBuilder.setAction(action).setGeojson(feature).getResult();
          request.osmElements = [];
          const missingElement = (request.geojson as FlattenedGeoJSON).geometry.type === 'Point' ? 'at least one' : 'way';

          const response = await requestSender.postChange(request);
          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected ${missingElement as string} element`);
        }
      );

      it.each(getAllFeatureCasesByAction(Actions.DELETE))(
        'should return 422 status code and error message indicating missing element on %s action and %s feature',
        async (action: Actions, feature: ExtendedFeatureType) => {
          const request = testDataBuilder.setAction(action).setGeojson(feature).getResult();
          request.osmElements = [];

          const response = await requestSender.postChange(request);
          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected at least one element`);
        }
      );

      it.each([Actions.MODIFY, Actions.DELETE])(
        'should return 422 status code when missing node on %s action and Point feature',
        async (action: Actions) => {
          const request = testDataBuilder.setAction(action).setGeojson('Point').setOsmElements('way').getResult();
          request.osmElements = request.osmElements.filter((element) => element.type === 'way');
          const missingElement = action === Actions.DELETE ? 'way' : 'node';

          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected ${missingElement} element`);
        }
      );
    });
  });
});

describe('changeWith3D', function () {
  beforeAll(async function () {
    const [initializedApp, initializedContainer] = await getApp({
      override: [
        {
          token: SERVICES.CONFIG,
          provider: { useValue: configMock({ shouldHandleLOD2: true }) },
        },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        {
          token: SERVICES.TRACER,
          provider: {
            useValue: trace.getTracer('test-tracer'),
          },
        },
      ],
      useChild: true,
    });

    app = initializedApp;
    container = initializedContainer;

    requestSender = new ChangeRequestSender(app);

    testDataBuilder = new TestDataBuilder();
  });

  afterEach(function () {
    jest.resetAllMocks();
    testDataBuilder.reset();
  });

  afterAll(function () {
    container.reset();
  });

  describe('POST /change', function () {
    describe('Happy Path 😸', function () {
      it.each(allExtendedFeatureTypesWith3D)(
        'should return 201 status code and the change generated that was invoked by create action and %s feature',
        async (feature: ExtendedFeatureType, is3d: boolean) => {
          const action = Actions.CREATE;
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).toHaveProperty('tempOsmId');
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each([...getAllFeatureCasesByAction(Actions.MODIFY, true), ...getAllFeatureCasesByAction(Actions.DELETE, true)])(
        'should return 201 status code and the change generated that was invoked by %s action and %s feature',
        async (action: Actions, feature: ExtendedFeatureType, is3d: boolean) => {
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).not.toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each(getAllFeatureCasesByAction(Actions.DELETE))(
        'should return 201 status code and the delete change generated that was invoked by %s action and %s feature with no geomerty on request',
        async (action: Actions, feature: ExtendedFeatureType, is3d: boolean) => {
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const { geometry, ...geojsonWithoutGeometry } = request.geojson;
          const response = await requestSender.postChange({ ...request, geojson: geojsonWithoutGeometry } as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).not.toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each(allExtendedFeatureTypesWith3D)(
        'should return 201 status code on create action and %s feature when osmElements is missing on the request',
        async (feature: ExtendedFeatureType, is3d: boolean) => {
          const action = Actions.CREATE;
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const { osmElements, ...rest } = request;
          const response = await requestSender.postChange(rest as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', rest.externalId);
          expect(response.body).toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it.each(allExtendedFeatureTypesWith3D)(
        'should return 201 status code on create action and %s feature when osmElements is empty on the request',
        async (feature: ExtendedFeatureType, is3d: boolean) => {
          const action = Actions.CREATE;
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          request.osmElements = [];
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      );

      it('should not fail if geojson geometry type is not one of the valid FeatureType on delete request', async function () {
        const request = testDataBuilder.setAction(Actions.DELETE).setGeojson('Point').getResult();
        (request.geojson as FlattenedGeoJSON).geometry.type = 'non_valid_type' as FeatureType;

        const response = await requestSender.postChange(request);

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe('Bad Path 🙀', function () {
      it('should return 400 if externalId is missing', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Polygon').getResult();
        const { externalId, ...rest } = request;
        const response = await requestSender.postChange(rest as ChangeRequestBody);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });

      it('should return 400 if action is not one of the valid Actions', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Polygon').getResult();
        request.action = 'non_valid_action' as Actions;
        const response = await requestSender.postChange(request);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });

      it('should return 400 if geojson is missing', async function () {
        const request = testDataBuilder.setAction(Actions.MODIFY).setGeojson('LineString').getResult();
        const { geojson, ...rest } = request;

        const response = await requestSender.postChange(rest as ChangeRequestBody);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });

      it('should return 400 if point geojson geometry coordinates has fewer coordinates than 2', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Point').getResult();
        (request.geojson as FlattenedGeoJSON).geometry.coordinates = [1];

        const response = await requestSender.postChange(request);
        const message = (response.body as { message: string }).message;

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(message).toContain('request/geojson/geometry/coordinates must NOT have fewer than 2 items');
      });

      it('should return 400 if point geojson geometry coordinates has more coordinates than 3', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Point').getResult();
        (request.geojson as FlattenedGeoJSON).geometry.coordinates = [1, 2, 3, 4];

        const response = await requestSender.postChange(request);
        const message = (response.body as { message: string }).message;

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(message).toContain('request/geojson/geometry/coordinates must NOT have more than 3 items');
      });

      it.each([...getAllFeatureCasesByAction(Actions.CREATE), ...getAllFeatureCasesByAction(Actions.MODIFY)])(
        'should return 400 status code and error message on %s action and %s feature if geometry is missing',
        async (action: Actions, feature: ExtendedFeatureType, is3d: boolean) => {
          const { request } = testDataBuilder.setAction(action).setGeojson(feature).setIs3D(is3d).getTestData();
          const { geometry, ...geojsonWithoutGeometry } = request.geojson;
          const response = await requestSender.postChange({ ...request, geojson: geojsonWithoutGeometry } as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
          const message = (response.body as { message: string }).message;
          expect(message).toContain("request/geojson must have required property 'geometry'");
        }
      );
    });

    describe('Sad Path 😿', function () {
      it.each(getAllFeatureCasesByAction(Actions.MODIFY))(
        'should return 422 status code and error message indicating missing element on %s action and %s feature',
        async (action: Actions, feature: ExtendedFeatureType) => {
          const request = testDataBuilder.setAction(action).setGeojson(feature).getResult();
          request.osmElements = [];
          const missingElement = (request.geojson as FlattenedGeoJSON).geometry.type === 'Point' ? 'at least one' : 'way';

          const response = await requestSender.postChange(request);
          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected ${missingElement as string} element`);
        }
      );

      it.each(getAllFeatureCasesByAction(Actions.DELETE))(
        'should return 422 status code and error message indicating missing element on %s action and %s feature',
        async (action: Actions, feature: ExtendedFeatureType) => {
          const request = testDataBuilder.setAction(action).setGeojson(feature).getResult();
          request.osmElements = [];

          const response = await requestSender.postChange(request);
          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected at least one element`);
        }
      );

      it.each([Actions.MODIFY, Actions.DELETE])(
        'should return 422 status code when missing node on %s action and Point feature',
        async (action: Actions) => {
          const request = testDataBuilder.setAction(action).setGeojson('Point').setOsmElements('way').getResult();
          request.osmElements = request.osmElements.filter((element) => element.type === 'way');
          const missingElement = action === Actions.DELETE ? 'way' : 'node';

          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected ${missingElement} element`);
        }
      );
    });
  });
});
