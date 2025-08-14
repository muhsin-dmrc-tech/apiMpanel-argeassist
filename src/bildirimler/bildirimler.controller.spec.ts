import { Test, TestingModule } from '@nestjs/testing';
import { BildirimlerController } from './bildirimler.controller';

describe('BildirimlerController', () => {
  let controller: BildirimlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BildirimlerController],
    }).compile();

    controller = module.get<BildirimlerController>(BildirimlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
