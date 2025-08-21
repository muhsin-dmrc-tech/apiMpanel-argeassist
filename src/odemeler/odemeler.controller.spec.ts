import { Test, TestingModule } from '@nestjs/testing';
import { OdemelerController } from './odemeler.controller';

describe('OdemelerController', () => {
  let controller: OdemelerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OdemelerController],
    }).compile();

    controller = module.get<OdemelerController>(OdemelerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
