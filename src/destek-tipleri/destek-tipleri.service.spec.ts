import { Test, TestingModule } from '@nestjs/testing';
import { DestekTipleriService } from './destek-tipleri.service';

describe('DestekTipleriService', () => {
  let service: DestekTipleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DestekTipleriService],
    }).compile();

    service = module.get<DestekTipleriService>(DestekTipleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
