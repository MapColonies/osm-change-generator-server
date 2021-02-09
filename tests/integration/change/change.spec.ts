/* eslint-disable @typescript-eslint/no-unused-vars */ // some vars are not really needed
/* eslint-disable jest/no-conditional-expect */ //needed for testing all action cases in one place
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { OsmElementType } from '@map-colonies/node-osm-elements';
import { Actions } from '@map-colonies/osm-change-generator';

import { ChangeRequestBody } from '../../../src/change/controllers/changeController';
import { registerTestValues } from '../testContainerConfig';
import { allActions, allFeatureTypes } from '../../common/constants';
import { FeatureType } from '../../../src/change/models/geojsonTypes';
import { ChangeModel } from '../../../src/change/models/change';
import { TestDataBuilder } from '../../common/testDataBuilder';
import * as requestSender from './helpers/requestSender';

let testDataBuilder: TestDataBuilder;

describe('change', function () {
  beforeAll(function () {
    registerTestValues();
    requestSender.init();
    testDataBuilder = new TestDataBuilder();
  });
  afterEach(function () {
    container.clearInstances();
    testDataBuilder.reset();
  });
  describe('POST /change', function () {
    describe('Happy Path 😸', function () {
      it('should return 201 status code and the change generated that was invoked by the correct action', async function () {
        for await (const action of allActions) {
          for await (const feature of allFeatureTypes) {
            const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).getTestData();
            const response = await requestSender.postChange(request);

            expect(response.status).toBe(httpStatusCodes.CREATED);
            expect(response.body).toHaveProperty('action', action);
            expect(response.body).toHaveProperty('externalId', request.externalId);
            if (action === Actions.CREATE) {
              expect(response.body).toHaveProperty('tempOsmId');
            } else {
              expect(response.body).not.toHaveProperty('tempOsmId', -1);
            }
            expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
          }
        }
      });
      it('should return 201 status code on create action when osmElements is missing on the request', async function () {
        const action = Actions.CREATE;
        for await (const feature of allFeatureTypes) {
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).getTestData();
          const { osmElements, ...rest } = request;
          const response = await requestSender.postChange(rest as ChangeRequestBody);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', rest.externalId);
          expect(response.body).toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      });
      it('should return 201 status code on create action when osmElements is empty on the request', async function () {
        const action = Actions.CREATE;
        for await (const feature of allFeatureTypes) {
          const { request, expectedResult } = testDataBuilder.setAction(action).setGeojson(feature).getTestData();
          request.osmElements = [];
          const response = await requestSender.postChange(request);

          expect(response.status).toBe(httpStatusCodes.CREATED);
          expect(response.body).toHaveProperty('action', action);
          expect(response.body).toHaveProperty('externalId', request.externalId);
          expect(response.body).toHaveProperty('tempOsmId', -1);
          expect((response.body as ChangeModel).change).toMatchObject(expectedResult);
        }
      });
    });
    describe('Bad Path 🙀', function () {
      it('should fail if externalId is missing', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Polygon').getResult();
        const { externalId, ...rest } = request;
        const response = await requestSender.postChange(rest as ChangeRequestBody);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });
      it('should fail if action is not one of the valid Actions', async function () {
        const request = testDataBuilder.setAction(Actions.CREATE).setGeojson('Polygon').getResult();
        request.action = 'non_valid_action' as Actions;
        const response = await requestSender.postChange(request);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });
      it('should fail if geojson is missing', async function () {
        const request = testDataBuilder.setAction(Actions.MODIFY).setGeojson('LineString').getResult();
        const { geojson, ...rest } = request;
        const response = await requestSender.postChange(rest as ChangeRequestBody);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });
      it('should fail if geojson geometry type is not one of the valid FeatureType', async function () {
        const request = testDataBuilder.setAction(Actions.DELETE).setGeojson('Point').getResult();
        request.geojson.geometry.type = 'non_valid_type' as FeatureType;
        const response = await requestSender.postChange(request);
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      });
    });
    describe('Sad Path 😿', function () {
      it('should return 422 status code and error message indicating missing element', async function () {
        for await (const action of [Actions.MODIFY, Actions.DELETE]) {
          for await (const featureType of allFeatureTypes) {
            const request = testDataBuilder.setAction(action).setGeojson(featureType).getResult();
            request.osmElements = [];
            const missingElement: OsmElementType = request.geojson.geometry.type === 'Point' ? 'node' : 'way';
            const response = await requestSender.postChange(request);
            expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
            expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected ${missingElement as string} element`);
          }
        }
      });
      it('should return 422 status code when missing node on point request', async function () {
        for await (const action of [Actions.MODIFY, Actions.DELETE]) {
          const request = testDataBuilder.setAction(action).setGeojson('Point').setOsmElements('way').getResult();
          request.osmElements = request.osmElements.filter((element) => element.type === 'way');
          const response = await requestSender.postChange(request);
          expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
          expect(response.body).toHaveProperty('message', `Could not parse osm-api-elements, expected node element`);
        }
      });
    });
  });
});
