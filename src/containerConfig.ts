import config from 'config';
import client from 'prom-client';
import { instancePerContainerCachingFactory } from 'tsyringe';
import { getOtelMixin, Metrics } from '@map-colonies/telemetry';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { trace, metrics as OtelMetrics } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { tracing } from './common/tracing';
import { IConfig } from './common/interfaces';
import { SERVICES, SERVICE_NAME, METRICS_REGISTRY } from './common/constants';
import { changeRouterFactory, CHANGE_ROUTER_SYMBOL } from './change/routes/changeRouter';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const metrics = new Metrics();
  metrics.start();

  const tracer = trace.getTracer(SERVICE_NAME);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METER, provider: { useValue: OtelMetrics.getMeterProvider().getMeter(SERVICE_NAME) } },
    { token: CHANGE_ROUTER_SYMBOL, provider: { useFactory: changeRouterFactory } },
    {
      token: METRICS_REGISTRY,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          const config = container.resolve<IConfig>(SERVICES.CONFIG);

          client.register.setDefaultLabels({ project: config.get<string>('app.projectName') });
          return client.register;
        }),
      },
    },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop(), metrics.stop()]);
          },
        },
      },
    },
  ];
  return registerDependencies(dependencies, options?.override, options?.useChild);
};
