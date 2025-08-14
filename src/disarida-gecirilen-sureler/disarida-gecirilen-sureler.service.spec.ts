import { Test, TestingModule } from '@nestjs/testing';
import { DisaridaGecirilenSurelerService } from './disarida-gecirilen-sureler.service';

describe('DisaridaGecirilenSurelerService', () => {
  let service: DisaridaGecirilenSurelerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisaridaGecirilenSurelerService],
    }).compile();

    service = module.get<DisaridaGecirilenSurelerService>(DisaridaGecirilenSurelerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
