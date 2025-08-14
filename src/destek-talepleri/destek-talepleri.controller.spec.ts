import { Test, TestingModule } from '@nestjs/testing';
import { DestekTalepleriController } from './destek-talepleri.controller';

describe('DestekTalepleriController', () => {
  let controller: DestekTalepleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestekTalepleriController],
    }).compile();

    controller = module.get<DestekTalepleriController>(DestekTalepleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
