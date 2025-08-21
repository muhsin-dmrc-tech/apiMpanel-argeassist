import { Test, TestingModule } from '@nestjs/testing';
import { FaturaBilgileriController } from './fatura-bilgileri.controller';

describe('FaturaBilgileriController', () => {
  let controller: FaturaBilgileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaturaBilgileriController],
    }).compile();

    controller = module.get<FaturaBilgileriController>(FaturaBilgileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
