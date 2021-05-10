import { container } from 'tsyringe';
import config from 'config';
import { Tracing, Metrics } from '@map-colonies/telemetry';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';

function registerTestValues(): void {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });

  const tracing = new Tracing('osm-change-generator-tracer');
  const tracer = tracing.start();
  container.register(Services.TRACER, { useValue: tracer });

  const metrics = new Metrics('osm-change-generator-server-meter');
  const meter = metrics.start();
  container.register(Services.METER, { useValue: meter });
}

export { registerTestValues };
