import { Test, TestingModule } from '@nestjs/testing';
import { MpAuthService } from './mp-auth.service';

describe('MpAuthService', () => {
  let service: MpAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MpAuthService],
    }).compile();

    service = module.get<MpAuthService>(MpAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
