import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ChangeController } from '../controllers/changeController';

const changeRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ChangeController);

  router.post('/', controller.createResource);

  return router;
};

export { changeRouterFactory as changeRouterFactory };
