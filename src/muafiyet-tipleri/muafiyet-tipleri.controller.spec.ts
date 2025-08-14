import { Test, TestingModule } from '@nestjs/testing';
import { MuafiyetTipleriController } from './muafiyet-tipleri.controller';

describe('MuafiyetTipleriController', () => {
  let controller: MuafiyetTipleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MuafiyetTipleriController],
    }).compile();

    controller = module.get<MuafiyetTipleriController>(MuafiyetTipleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
