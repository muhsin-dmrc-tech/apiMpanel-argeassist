import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGelirBilgileriController } from './proje-gelir-bilgileri.controller';

describe('ProjeGelirBilgileriController', () => {
  let controller: ProjeGelirBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeGelirBilgileriController],
    }).compile();

    controller = module.get<ProjeGelirBilgileriController>(ProjeGelirBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
