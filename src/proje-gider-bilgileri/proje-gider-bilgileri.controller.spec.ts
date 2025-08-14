import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGiderBilgileriController } from './proje-gider-bilgileri.controller';

describe('ProjeGiderBilgileriController', () => {
  let controller: ProjeGiderBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeGiderBilgileriController],
    }).compile();

    controller = module.get<ProjeGiderBilgileriController>(ProjeGiderBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
