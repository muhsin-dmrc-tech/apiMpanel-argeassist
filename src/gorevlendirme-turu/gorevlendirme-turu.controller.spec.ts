import { Test, TestingModule } from '@nestjs/testing';
import { GorevlendirmeTuruController } from './gorevlendirme-turu.controller';

describe('GorevlendirmeTuruController', () => {
  let controller: GorevlendirmeTuruController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GorevlendirmeTuruController],
    }).compile();

    controller = module.get<GorevlendirmeTuruController>(GorevlendirmeTuruController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
