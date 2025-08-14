import { Test, TestingModule } from '@nestjs/testing';
import { IzinTalepleriService } from './izin-talepleri.service';

describe('IzinTalepleriService', () => {
  let service: IzinTalepleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IzinTalepleriService],
    }).compile();

    service = module.get<IzinTalepleriService>(IzinTalepleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
