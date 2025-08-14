import { Test, TestingModule } from '@nestjs/testing';
import { ProjeIlerlemeBilgilerController } from './proje-ilerleme-bilgiler.controller';

describe('ProjeIlerlemeBilgilerController', () => {
  let controller: ProjeIlerlemeBilgilerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeIlerlemeBilgilerController],
    }).compile();

    controller = module.get<ProjeIlerlemeBilgilerController>(ProjeIlerlemeBilgilerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
