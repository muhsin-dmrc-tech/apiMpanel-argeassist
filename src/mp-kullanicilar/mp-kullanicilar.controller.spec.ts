import { Test, TestingModule } from '@nestjs/testing';
import { MpKullanicilarController } from './mp-kullanicilar.controller';

describe('MpKullanicilarController', () => {
  let controller: MpKullanicilarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MpKullanicilarController],
    }).compile();

    controller = module.get<MpKullanicilarController>(MpKullanicilarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
