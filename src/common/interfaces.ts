import { GetChangeOptions } from '@map-colonies/osm-change-generator';

export interface IServerConfig {
  port: string;
}

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IApp extends GetChangeOptions {}
