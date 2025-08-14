import { Test, TestingModule } from '@nestjs/testing';
import { AbonelikPlanlariService } from './abonelik-planlari.service';

describe('AbonelikPlanlariService', () => {
  let service: AbonelikPlanlariService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbonelikPlanlariService],
    }).compile();

    service = module.get<AbonelikPlanlariService>(AbonelikPlanlariService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
