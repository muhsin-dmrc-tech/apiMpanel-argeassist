import { Test, TestingModule } from '@nestjs/testing';
import { ProjeBasvuruController } from './proje-basvuru.controller';

describe('ProjeBasvuruController', () => {
  let controller: ProjeBasvuruController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeBasvuruController],
    }).compile();

    controller = module.get<ProjeBasvuruController>(ProjeBasvuruController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
