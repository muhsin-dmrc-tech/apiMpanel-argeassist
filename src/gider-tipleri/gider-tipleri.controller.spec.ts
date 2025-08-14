import { Test, TestingModule } from '@nestjs/testing';
import { GiderTipleriController } from './gider-tipleri.controller';

describe('GiderTipleriController', () => {
  let controller: GiderTipleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiderTipleriController],
    }).compile();

    controller = module.get<GiderTipleriController>(GiderTipleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
