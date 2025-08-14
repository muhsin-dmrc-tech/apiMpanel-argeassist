import { Test, TestingModule } from '@nestjs/testing';
import { KullanicilarController } from './kullanicilar.controller';
import { KullanicilarService } from './kullanicilar.service';

describe('UsersController', () => {
  let controller: KullanicilarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KullanicilarController],
      providers: [KullanicilarService],
    }).compile();

    controller = module.get<KullanicilarController>(KullanicilarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
