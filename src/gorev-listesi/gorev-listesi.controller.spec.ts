import { Test, TestingModule } from '@nestjs/testing';
import { GorevListesiController } from './gorev-listesi.controller';

describe('GorevListesiController', () => {
  let controller: GorevListesiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GorevListesiController],
    }).compile();

    controller = module.get<GorevListesiController>(GorevListesiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
