import { Test, TestingModule } from '@nestjs/testing';
import { IzinSureleriService } from './izin-sureleri.service';

describe('IzinSureleriService', () => {
  let service: IzinSureleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IzinSureleriService],
    }).compile();

    service = module.get<IzinSureleriService>(IzinSureleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
