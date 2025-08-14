import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGelirBilgileriController } from './proje-disi-gelir-bilgileri.controller';

describe('ProjeDisiGelirBilgileriController', () => {
  let controller: ProjeDisiGelirBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisiGelirBilgileriController],
    }).compile();

    controller = module.get<ProjeDisiGelirBilgileriController>(ProjeDisiGelirBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
