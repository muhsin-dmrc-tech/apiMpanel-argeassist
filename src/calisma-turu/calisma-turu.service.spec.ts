import { Test, TestingModule } from '@nestjs/testing';
import { CalismaTuruService } from './calisma-turu.service';

describe('CalismaTuruService', () => {
  let service: CalismaTuruService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalismaTuruService],
    }).compile();

    service = module.get<CalismaTuruService>(CalismaTuruService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
