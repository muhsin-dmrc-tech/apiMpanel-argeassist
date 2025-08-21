import { Test, TestingModule } from '@nestjs/testing';
import { FirmaAbonelikleriController } from './firma-abonelikleri.controller';

describe('FirmaAbonelikleriController', () => {
  let controller: FirmaAbonelikleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirmaAbonelikleriController],
    }).compile();

    controller = module.get<FirmaAbonelikleriController>(FirmaAbonelikleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
