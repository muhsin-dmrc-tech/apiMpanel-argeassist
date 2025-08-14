import { Test, TestingModule } from '@nestjs/testing';
import { GrupYetkileriService } from './grup-yetkileri.service';

describe('GrupYetkileriService', () => {
  let service: GrupYetkileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrupYetkileriService],
    }).compile();

    service = module.get<GrupYetkileriService>(GrupYetkileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
