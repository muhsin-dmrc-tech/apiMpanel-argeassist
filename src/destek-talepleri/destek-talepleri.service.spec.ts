import { Test, TestingModule } from '@nestjs/testing';
import { DestekTalepleriService } from './destek-talepleri.service';

describe('DestekTalepleriService', () => {
  let service: DestekTalepleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DestekTalepleriService],
    }).compile();

    service = module.get<DestekTalepleriService>(DestekTalepleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
