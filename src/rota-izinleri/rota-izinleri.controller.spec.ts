import { Test, TestingModule } from '@nestjs/testing';
import { RotaIzinleriController } from './rota-izinleri.controller';

describe('RotaIzinleriController', () => {
  let controller: RotaIzinleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RotaIzinleriController],
    }).compile();

    controller = module.get<RotaIzinleriController>(RotaIzinleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
