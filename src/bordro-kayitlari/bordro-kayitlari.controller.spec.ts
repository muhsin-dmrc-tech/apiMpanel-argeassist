import { Test, TestingModule } from '@nestjs/testing';
import { BordroKayitlariController } from './bordro-kayitlari.controller';

describe('BordroKayitlariController', () => {
  let controller: BordroKayitlariController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BordroKayitlariController],
    }).compile();

    controller = module.get<BordroKayitlariController>(BordroKayitlariController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
