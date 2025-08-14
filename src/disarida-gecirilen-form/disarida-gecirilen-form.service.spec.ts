import { Test, TestingModule } from '@nestjs/testing';
import { DisaridaGecirilenFormService } from './disarida-gecirilen-form.service';

describe('DisaridaGecirilenFormService', () => {
  let service: DisaridaGecirilenFormService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisaridaGecirilenFormService],
    }).compile();

    service = module.get<DisaridaGecirilenFormService>(DisaridaGecirilenFormService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
