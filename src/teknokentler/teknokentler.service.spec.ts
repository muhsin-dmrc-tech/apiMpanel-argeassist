import { Test, TestingModule } from '@nestjs/testing';
import { TeknokentlerService } from './teknokentler.service';

describe('TeknokentlerService', () => {
  let service: TeknokentlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeknokentlerService],
    }).compile();

    service = module.get<TeknokentlerService>(TeknokentlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
