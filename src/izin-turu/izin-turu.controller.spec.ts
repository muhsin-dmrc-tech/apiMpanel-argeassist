import { Test, TestingModule } from '@nestjs/testing';
import { IzinTuruController } from './izin-turu.controller';

describe('IzinTuruController', () => {
  let controller: IzinTuruController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IzinTuruController],
    }).compile();

    controller = module.get<IzinTuruController>(IzinTuruController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
