import { Test, TestingModule } from '@nestjs/testing';
import { ProjeBasvuruService } from './proje-basvuru.service';

describe('ProjeBasvuruService', () => {
  let service: ProjeBasvuruService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeBasvuruService],
    }).compile();

    service = module.get<ProjeBasvuruService>(ProjeBasvuruService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
