import { Test, TestingModule } from '@nestjs/testing';
import { GorevlendirmeTuruService } from './gorevlendirme-turu.service';

describe('GorevlendirmeTuruService', () => {
  let service: GorevlendirmeTuruService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GorevlendirmeTuruService],
    }).compile();

    service = module.get<GorevlendirmeTuruService>(GorevlendirmeTuruService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
