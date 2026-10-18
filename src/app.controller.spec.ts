import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHomePage: () => '<html>Reyansha API</html>',
            getApiInfo: () => ({ service: 'Reyansha API' }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns the homepage content', () => {
      expect(appController.getRoot()).toBe('<html>Reyansha API</html>');
    });

    it('returns API information at the API root', () => {
      expect(appController.getApiV1Root()).toEqual({
        service: 'Reyansha API',
      });
    });
  });
});
