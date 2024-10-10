import { container } from 'tsyringe';
import config from 'config';
import { trace } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api-metrics';
import jsLogger from '@map-colonies/js-logger';
import { Services, SHOULD_HANDLE_3D } from '../../src/common/constants';

function registerTestValues(is3d: boolean): void {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });
  container.register(Services.TRACER, { useValue: trace.getTracer('test') });
  container.register(Services.METER, { useValue: metrics.getMeter('test') });
  container.register(SHOULD_HANDLE_3D, { useValue: is3d });
}

export { registerTestValues };
