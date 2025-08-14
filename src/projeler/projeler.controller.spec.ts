import { Test, TestingModule } from '@nestjs/testing';
import { ProjelerController } from './projeler.controller';

describe('ProjelerController', () => {
  let controller: ProjelerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjelerController],
    }).compile();

    controller = module.get<ProjelerController>(ProjelerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
