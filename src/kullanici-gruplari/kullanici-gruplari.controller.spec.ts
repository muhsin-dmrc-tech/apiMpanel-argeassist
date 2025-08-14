import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciGruplariController } from './kullanici-gruplari.controller';

describe('KullaniciGruplariController', () => {
  let controller: KullaniciGruplariController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KullaniciGruplariController],
    }).compile();

    controller = module.get<KullaniciGruplariController>(KullaniciGruplariController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
