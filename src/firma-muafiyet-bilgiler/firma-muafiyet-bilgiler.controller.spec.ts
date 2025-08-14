import { Test, TestingModule } from '@nestjs/testing';
import { FirmaMuafiyetBilgilerController } from './firma-muafiyet-bilgiler.controller';

describe('FirmaMuafiyetBilgilerController', () => {
  let controller: FirmaMuafiyetBilgilerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirmaMuafiyetBilgilerController],
    }).compile();

    controller = module.get<FirmaMuafiyetBilgilerController>(FirmaMuafiyetBilgilerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
