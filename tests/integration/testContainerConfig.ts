import { container } from 'tsyringe';
import config from 'config';
import { trace } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api-metrics';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';
import { IApp } from '../../src/common/interfaces';

function registerTestValues(appConfig: IApp): void {
  const overrideConfig = {
    get: (key: string): unknown => {
      switch (key) {
        case 'app':
          return appConfig;
        default:
          return config.get(key);
      }
    },
  };

  container.register(Services.CONFIG, { useValue: overrideConfig });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });
  container.register(Services.TRACER, { useValue: trace.getTracer('test') });
  container.register(Services.METER, { useValue: metrics.getMeter('test') });
}

export { registerTestValues };
