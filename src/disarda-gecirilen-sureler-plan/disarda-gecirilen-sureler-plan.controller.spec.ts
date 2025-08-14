import { Test, TestingModule } from '@nestjs/testing';
import { DisardaGecirilenSurelerPlanController } from './disarda-gecirilen-sureler-plan.controller';

describe('DisardaGecirilenSurelerPlanController', () => {
  let controller: DisardaGecirilenSurelerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisardaGecirilenSurelerPlanController],
    }).compile();

    controller = module.get<DisardaGecirilenSurelerPlanController>(DisardaGecirilenSurelerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
