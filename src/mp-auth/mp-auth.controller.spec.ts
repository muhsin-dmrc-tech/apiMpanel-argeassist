import { Test, TestingModule } from '@nestjs/testing';
import { MpAuthController } from './mp-auth.controller';

describe('MpAuthController', () => {
  let controller: MpAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MpAuthController],
    }).compile();

    controller = module.get<MpAuthController>(MpAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
