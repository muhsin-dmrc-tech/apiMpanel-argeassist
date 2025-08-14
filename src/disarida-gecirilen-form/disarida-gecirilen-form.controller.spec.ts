import { Test, TestingModule } from '@nestjs/testing';
import { DisaridaGecirilenFormController } from './disarida-gecirilen-form.controller';

describe('DisaridaGecirilenFormController', () => {
  let controller: DisaridaGecirilenFormController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisaridaGecirilenFormController],
    }).compile();

    controller = module.get<DisaridaGecirilenFormController>(DisaridaGecirilenFormController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
