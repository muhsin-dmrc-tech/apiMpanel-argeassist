import { Test, TestingModule } from '@nestjs/testing';
import { BordroHesaplamaController } from './bordro-hesaplama.controller';

describe('BordroHesaplamaController', () => {
  let controller: BordroHesaplamaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BordroHesaplamaController],
    }).compile();

    controller = module.get<BordroHesaplamaController>(BordroHesaplamaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
