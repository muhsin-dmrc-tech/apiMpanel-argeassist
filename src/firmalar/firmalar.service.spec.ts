import { Test, TestingModule } from '@nestjs/testing';
import { FirmalarService } from './firmalar.service';

describe('FirmalarService', () => {
  let service: FirmalarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirmalarService],
    }).compile();

    service = module.get<FirmalarService>(FirmalarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
