import { Test, TestingModule } from '@nestjs/testing';
import { MpDokumanlarService } from './mp-dokumanlar.service';

describe('MpDokumanlarService', () => {
  let service: MpDokumanlarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MpDokumanlarService],
    }).compile();

    service = module.get<MpDokumanlarService>(MpDokumanlarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
