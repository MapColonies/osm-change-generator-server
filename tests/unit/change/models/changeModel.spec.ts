import { Actions } from '@map-colonies/osm-change-generator/dist/models';
import { OsmChange } from '@map-colonies/node-osm-elements';

import * as functions from '../../../../src/change/models/functions';
import { ChangeManager } from '../../../../src/change/models/changeManager';
import { ChangeModel } from '../../../../src/change/models/change';
import { actionToChangeMap, templateChangeRequest } from '../../../common/constants';
import { getRandomId } from './helpers';

let changeManager: ChangeManager;

describe('ChangeManager', () => {
  beforeEach(function () {
    changeManager = new ChangeManager({ log: jest.fn() });
    jest.restoreAllMocks();
  });
  describe('#generateChange', () => {
    it('should return a create changeModel with tempOsmId', function () {
      const action = Actions.CREATE;
      const change = actionToChangeMap.get(action) as OsmChange;
      jest.spyOn(functions, 'generateOsmChange').mockImplementation(() => change);

      const tempOsmIdValue = getRandomId();
      const tempOsmIdSpy = jest.spyOn(functions, 'getTempOsmId').mockReturnValue(tempOsmIdValue);

      const { externalId, osmElements, geojson } = templateChangeRequest;
      const expectedReuslt: ChangeModel = {
        action,
        change,
        externalId,
        tempOsmId: tempOsmIdValue,
      };

      const result = changeManager.generateChange(action, geojson, osmElements, externalId);

      expect(result).toMatchObject(expectedReuslt);
      expect(result).toHaveProperty('tempOsmId', tempOsmIdValue);
      expect(tempOsmIdSpy).toHaveBeenCalled();
    });

    it('should return a modify or delete changeModel without tempOsmId', function () {
      const actions = [Actions.MODIFY, Actions.DELETE];
      const tempOsmIdSpy = jest.spyOn(functions, 'getTempOsmId');
      const { externalId, osmElements, geojson } = templateChangeRequest;

      actions.forEach((action) => {
        const change = actionToChangeMap.get(action) as OsmChange;
        jest.spyOn(functions, 'generateOsmChange').mockImplementation(() => change);
        const expectedReuslt: ChangeModel = {
          action,
          change,
          externalId,
        };

        const result = changeManager.generateChange(action, geojson, osmElements, externalId);

        expect(result).toMatchObject(expectedReuslt);
        expect(result).not.toHaveProperty('tempOsmId');
        expect(tempOsmIdSpy).not.toHaveBeenCalled();
      });
    });
  });
});
