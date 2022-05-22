// this import must be called before the first import of tsyring
import 'reflect-metadata';
import './common/tracing';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import config from 'config';
import { DEFAULT_SERVER_PORT, Services } from './common/constants';
import { IServerConfig } from './common/interfaces';
import { getApp } from './app';

const serverConfig = config.get<IServerConfig>('server');
const port: number = parseInt(serverConfig.port) || DEFAULT_SERVER_PORT;
const app = getApp();

const logger = container.resolve<Logger>(Services.LOGGER);
const stubHealthcheck = async (): Promise<void> => Promise.resolve();
// eslint-disable-next-line @typescript-eslint/naming-convention
const server = createTerminus(createServer(app), { healthChecks: { '/liveness': stubHealthcheck }, onSignal: container.resolve('onSignal') });

server.listen(port, () => {
  logger.info(`app started on port ${port}`);
});
