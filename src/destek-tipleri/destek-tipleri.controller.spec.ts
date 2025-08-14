import { Test, TestingModule } from '@nestjs/testing';
import { DestekTipleriController } from './destek-tipleri.controller';

describe('DestekTipleriController', () => {
  let controller: DestekTipleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestekTipleriController],
    }).compile();

    controller = module.get<DestekTipleriController>(DestekTipleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
