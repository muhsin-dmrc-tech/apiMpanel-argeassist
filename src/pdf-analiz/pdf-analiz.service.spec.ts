import { Test, TestingModule } from '@nestjs/testing';
import { PdfAnalizService } from './pdf-analiz.service';

describe('PdfAnalizService', () => {
  let service: PdfAnalizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfAnalizService],
    }).compile();

    service = module.get<PdfAnalizService>(PdfAnalizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
