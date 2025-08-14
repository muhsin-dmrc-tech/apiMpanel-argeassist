import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciBildirimleriController } from './kullanici-bildirimleri.controller';

describe('KullaniciBildirimleriController', () => {
  let controller: KullaniciBildirimleriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KullaniciBildirimleriController],
    }).compile();

    controller = module.get<KullaniciBildirimleriController>(KullaniciBildirimleriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
