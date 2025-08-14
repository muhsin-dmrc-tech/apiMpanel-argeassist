import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiDisTicaretBilgileriController } from './proje-disi-dis-ticaret-bilgileri.controller';

describe('ProjeDisiDisTicaretBilgileriController', () => {
  let controller: ProjeDisiDisTicaretBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisiDisTicaretBilgileriController],
    }).compile();

    controller = module.get<ProjeDisiDisTicaretBilgileriController>(ProjeDisiDisTicaretBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
