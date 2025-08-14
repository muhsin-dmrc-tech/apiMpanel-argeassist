import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGiderBilgileriController } from './proje-disi-gider-bilgileri.controller';

describe('ProjeDisiGiderBilgileriController', () => {
  let controller: ProjeDisiGiderBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisiGiderBilgileriController],
    }).compile();

    controller = module.get<ProjeDisiGiderBilgileriController>(ProjeDisiGiderBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
