import { OsmChange, OsmElementType } from '@map-colonies/node-osm-elements';
import { Actions } from '@map-colonies/osm-change-generator';
import { FlattenedGeoJSON } from '../../src/change/models/geojsonTypes';
import { ChangeRequestBody } from '../../src/change/controllers/changeController';
import { getFeatureMap, OsmApiToElement, osmElementsMap } from './samples/sampleData';
import { OSM_CHANGE_SAMPLES } from './samples/sampleOsmChanges';
import { ExtendedFeatureType, externalId } from './constants';

interface TestData {
  request: ChangeRequestBody;
  expectedResult: OsmChange;
}

export type TestChangeRequestBody = Omit<ChangeRequestBody, 'geojson'> & { geojson: FlattenedGeoJSON };

export class TestDataBuilder {
  private request: Partial<TestChangeRequestBody> = {};
  private is3d?: boolean;

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

  public setIs3D(is3d: boolean): TestDataBuilder {
    this.is3d = is3d;
    return this;
  }

  public setGeojson(geojsonType: ExtendedFeatureType): TestDataBuilder {
    const geojsonSample = getFeatureMap().get(geojsonType);
    this.request.geojson = geojsonSample;
    let osmType: OsmElementType = 'way';
    if (geojsonType === 'Point' || geojsonType === '3DPoint') {
      osmType = 'node';
    }
    return this.setOsmElements(osmType);
  }

  public setOsmElements(osmType: OsmElementType): TestDataBuilder {
    const osmElementsSample = (osmElementsMap.get(osmType) as OsmApiToElement).apiElements;
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
    const is3d = this.is3d;
    const data = OSM_CHANGE_SAMPLES.find((change) => change.action === action && change.feature === feature && change.is3d === is3d);
    return data?.change as OsmChange;
  }
}
