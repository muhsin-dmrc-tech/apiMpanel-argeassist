import { Test, TestingModule } from '@nestjs/testing';
import { IzinTalepleriController } from './izin-talepleri.controller';

describe('IzinTalepleriController', () => {
  let controller: IzinTalepleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IzinTalepleriController],
    }).compile();

    controller = module.get<IzinTalepleriController>(IzinTalepleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
