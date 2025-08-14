import { Test, TestingModule } from '@nestjs/testing';
import { MpDokumanlarController } from './mp-dokumanlar.controller';

describe('MpDokumanlarController', () => {
  let controller: MpDokumanlarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MpDokumanlarController],
    }).compile();

    controller = module.get<MpDokumanlarController>(MpDokumanlarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
