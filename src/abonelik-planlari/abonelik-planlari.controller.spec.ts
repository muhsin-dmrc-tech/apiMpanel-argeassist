import { Test, TestingModule } from '@nestjs/testing';
import { AbonelikPlanlariController } from './abonelik-planlari.controller';

describe('AbonelikPlanlariController', () => {
  let controller: AbonelikPlanlariController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbonelikPlanlariController],
    }).compile();

    controller = module.get<AbonelikPlanlariController>(AbonelikPlanlariController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
