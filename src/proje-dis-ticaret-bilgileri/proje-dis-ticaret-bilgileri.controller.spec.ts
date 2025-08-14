import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisTicaretBilgileriController } from './proje-dis-ticaret-bilgileri.controller';

describe('ProjeDisTicaretBilgileriController', () => {
  let controller: ProjeDisTicaretBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisTicaretBilgileriController],
    }).compile();

    controller = module.get<ProjeDisTicaretBilgileriController>(ProjeDisTicaretBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
