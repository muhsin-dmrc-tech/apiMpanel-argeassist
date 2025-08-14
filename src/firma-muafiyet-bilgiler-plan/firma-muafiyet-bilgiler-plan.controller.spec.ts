import { Test, TestingModule } from '@nestjs/testing';
import { FirmaMuafiyetBilgilerPlanController } from './firma-muafiyet-bilgiler-plan.controller';

describe('FirmaMuafiyetBilgilerPlanController', () => {
  let controller: FirmaMuafiyetBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirmaMuafiyetBilgilerPlanController],
    }).compile();

    controller = module.get<FirmaMuafiyetBilgilerPlanController>(FirmaMuafiyetBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
