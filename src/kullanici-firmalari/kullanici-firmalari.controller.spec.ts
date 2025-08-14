import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciFirmalariController } from './kullanici-firmalari.controller';

describe('KullaniciFirmalariController', () => {
  let controller: KullaniciFirmalariController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KullaniciFirmalariController],
    }).compile();

    controller = module.get<KullaniciFirmalariController>(KullaniciFirmalariController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
