import { Test, TestingModule } from '@nestjs/testing';
import { FirmalarController } from './firmalar.controller';

describe('FirmalarController', () => {
  let controller: FirmalarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirmalarController],
    }).compile();

    controller = module.get<FirmalarController>(FirmalarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
