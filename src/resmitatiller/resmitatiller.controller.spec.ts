import { Test, TestingModule } from '@nestjs/testing';
import { ResmitatillerController } from './resmitatiller.controller';

describe('ResmitatillerController', () => {
  let controller: ResmitatillerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResmitatillerController],
    }).compile();

    controller = module.get<ResmitatillerController>(ResmitatillerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
