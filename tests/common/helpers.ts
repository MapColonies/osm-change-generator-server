import { ConfigType, getConfig } from '@src/common/config';
import { IApp } from '@src/common/interfaces';

export const configMock = (appConfig: IApp): ConfigType => {
  const config = getConfig();

  return {
    ...config,
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'app':
          return appConfig;
        default:
          return config.get(key);
      }
    }),
  };
};
