import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciDavetleriController } from './kullanici-davetleri.controller';

describe('KullaniciDavetleriController', () => {
  let controller: KullaniciDavetleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KullaniciDavetleriController],
    }).compile();

    controller = module.get<KullaniciDavetleriController>(KullaniciDavetleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
