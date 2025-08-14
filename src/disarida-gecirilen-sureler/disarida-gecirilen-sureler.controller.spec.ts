import { Test, TestingModule } from '@nestjs/testing';
import { DisaridaGecirilenSurelerController } from './disarida-gecirilen-sureler.controller';

describe('DisaridaGecirilenSurelerController', () => {
  let controller: DisaridaGecirilenSurelerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisaridaGecirilenSurelerController],
    }).compile();

    controller = module.get<DisaridaGecirilenSurelerController>(DisaridaGecirilenSurelerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
