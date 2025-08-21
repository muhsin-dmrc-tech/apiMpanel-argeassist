import { Test, TestingModule } from '@nestjs/testing';
import { SiparislerController } from './siparisler.controller';

describe('SiparislerController', () => {
  let controller: SiparislerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiparislerController],
    }).compile();

    controller = module.get<SiparislerController>(SiparislerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
