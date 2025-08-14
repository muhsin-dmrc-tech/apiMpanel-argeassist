import { Test, TestingModule } from '@nestjs/testing';
import { MuafiyetTipleriService } from './muafiyet-tipleri.service';

describe('MuafiyetTipleriService', () => {
  let service: MuafiyetTipleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MuafiyetTipleriService],
    }).compile();

    service = module.get<MuafiyetTipleriService>(MuafiyetTipleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
