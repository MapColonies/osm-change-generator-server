import { OsmChange, OsmElementType } from '@map-colonies/node-osm-elements';
import { Actions } from '@map-colonies/osm-change-generator/dist/models';

import { ChangeRequestBody } from '../../src/change/controllers/changeController';
import { FeatureType } from '../../src/change/models/geojsonTypes';
import { getFeatureMap, osmElementsMap } from './samples/sampleData';
import { OSM_CHANGE_SAMPLES } from './samples/sampleOsmChanges';
import { externalId } from './constants';

interface TestData {
  request: ChangeRequestBody;
  expectedResult: OsmChange;
}

export class TestDataBuilder {
  private request: Partial<ChangeRequestBody> = {};

  public constructor() {
    this.reset();
  }

  public reset(): void {
    this.request = {
      externalId: externalId,
    };
  }

  public setAction(action: Actions): TestDataBuilder {
    this.request.action = action;
    return this;
  }

  public setGeojson(geojsonType: FeatureType): TestDataBuilder {
    const geojsonSample = getFeatureMap().get(geojsonType);
    this.request.geojson = geojsonSample;
    let osmType: OsmElementType = 'way';
    if (geojsonType === 'Point') {
      osmType = 'node';
    }
    return this.setOsmElements(osmType);
  }

  public setOsmElements(osmType: OsmElementType): TestDataBuilder {
    const osmElementsSample = osmElementsMap.get(osmType);
    this.request.osmElements = osmElementsSample;
    return this;
  }

  public getResult(): ChangeRequestBody {
    return this.request as ChangeRequestBody;
  }

  public getTestData(): TestData {
    const request = this.getResult();
    const expectedResult = this.getExpectedOsmChange();
    return { request, expectedResult };
  }

  private getExpectedOsmChange(): OsmChange {
    const action = this.request.action;
    const feature = this.request.geojson?.geometry.type;
    const data = OSM_CHANGE_SAMPLES.find((change) => change.action === action && change.feature === feature);
    return data?.change as OsmChange;
  }
}
