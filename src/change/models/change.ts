import { OsmChange } from '@map-colonies/node-osm-elements';
import { Actions } from '@map-colonies/osm-change-generator';

export interface ChangeModel {
  action: Actions;
  externalId: string;
  change: OsmChange;
  tempOsmId?: number;
}
