import { Test, TestingModule } from '@nestjs/testing';
import { SgkhizmetListesiController } from './sgkhizmet-listesi.controller';

describe('SgkhizmetListesiController', () => {
  let controller: SgkhizmetListesiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SgkhizmetListesiController],
    }).compile();

    controller = module.get<SgkhizmetListesiController>(SgkhizmetListesiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
