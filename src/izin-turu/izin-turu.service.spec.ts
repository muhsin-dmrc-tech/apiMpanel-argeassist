import { Test, TestingModule } from '@nestjs/testing';
import { IzinTuruService } from './izin-turu.service';

describe('IzinTuruService', () => {
  let service: IzinTuruService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IzinTuruService],
    }).compile();

    service = module.get<IzinTuruService>(IzinTuruService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
