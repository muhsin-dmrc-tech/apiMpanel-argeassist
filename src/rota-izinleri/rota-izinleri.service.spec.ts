import { Test, TestingModule } from '@nestjs/testing';
import { RotaIzinleriService } from './rota-izinleri.service';

describe('RotaIzinleriService', () => {
  let service: RotaIzinleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RotaIzinleriService],
    }).compile();

    service = module.get<RotaIzinleriService>(RotaIzinleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
