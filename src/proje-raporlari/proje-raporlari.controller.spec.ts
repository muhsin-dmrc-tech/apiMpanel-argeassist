import { Test, TestingModule } from '@nestjs/testing';
import { ProjeRaporlariController } from './proje-raporlari.controller';

describe('ProjeRaporlariController', () => {
  let controller: ProjeRaporlariController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeRaporlariController],
    }).compile();

    controller = module.get<ProjeRaporlariController>(ProjeRaporlariController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
