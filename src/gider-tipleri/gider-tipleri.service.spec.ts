import { Test, TestingModule } from '@nestjs/testing';
import { GiderTipleriService } from './gider-tipleri.service';

describe('GiderTipleriService', () => {
  let service: GiderTipleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GiderTipleriService],
    }).compile();

    service = module.get<GiderTipleriService>(GiderTipleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
