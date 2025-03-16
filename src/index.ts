// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import { createServer } from 'http';
import { DependencyContainer } from 'tsyringe';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { ON_SIGNAL, SERVICES } from '@common/constants';
import { ConfigType } from '@common/config';
import { getApp } from './app';

let container: DependencyContainer | undefined;

void getApp()
  .then(([app, container]) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port = config.get('server.port');
    const stubHealthCheck = async (): Promise<void> => Promise.resolve();
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const server = createTerminus(createServer(app), { healthChecks: { '/liveness': stubHealthCheck }, onSignal: container.resolve(ON_SIGNAL) });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch(async (error: Error) => {
    const errorLogger =
      container?.isRegistered(SERVICES.LOGGER) == true
        ? container.resolve<Logger>(SERVICES.LOGGER).error.bind(container.resolve<Logger>(SERVICES.LOGGER))
        : console.error;
    errorLogger({ msg: '😢 - failed initializing the server', err: error });

    if (container?.isRegistered(ON_SIGNAL) == true) {
      const shutDown: () => Promise<void> = container.resolve(ON_SIGNAL);
      await shutDown();
    }
    process.exit(1);
  });
