import { Test, TestingModule } from '@nestjs/testing';
import { IzinSureleriController } from './izin-sureleri.controller';

describe('IzinSureleriController', () => {
  let controller: IzinSureleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IzinSureleriController],
    }).compile();

    controller = module.get<IzinSureleriController>(IzinSureleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
