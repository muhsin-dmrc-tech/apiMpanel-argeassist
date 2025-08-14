import { Test, TestingModule } from '@nestjs/testing';
import { CalismaTuruController } from './calisma-turu.controller';

describe('CalismaTuruController', () => {
  let controller: CalismaTuruController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalismaTuruController],
    }).compile();

    controller = module.get<CalismaTuruController>(CalismaTuruController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
