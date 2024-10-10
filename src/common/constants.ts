export const DEFAULT_SERVER_PORT = 80;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/, /^.*\/metrics.*/];

export enum Services {
  LOGGER = 'ILogger',
  CONFIG = 'IConfig',
  TRACER = 'TRACER',
  METER = 'METER',
}

export const SHOULD_HANDLE_3D = Symbol('should_handle_3d');
