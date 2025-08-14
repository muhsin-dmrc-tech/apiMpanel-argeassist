import { Test, TestingModule } from '@nestjs/testing';
import { SozlesmelerController } from './sozlesmeler.controller';

describe('SozlesmelerController', () => {
  let controller: SozlesmelerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SozlesmelerController],
    }).compile();

    controller = module.get<SozlesmelerController>(SozlesmelerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
