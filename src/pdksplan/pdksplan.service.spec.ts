import { Test, TestingModule } from '@nestjs/testing';
import { PdksplanService } from './pdksplan.service';

describe('PdksplanService', () => {
  let service: PdksplanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdksplanService],
    }).compile();

    service = module.get<PdksplanService>(PdksplanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
