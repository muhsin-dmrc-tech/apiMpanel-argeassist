import { Test, TestingModule } from '@nestjs/testing';
import { FirmaMuafiyetBilgilerService } from './firma-muafiyet-bilgiler.service';

describe('FirmaMuafiyetBilgilerService', () => {
  let service: FirmaMuafiyetBilgilerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirmaMuafiyetBilgilerService],
    }).compile();

    service = module.get<FirmaMuafiyetBilgilerService>(FirmaMuafiyetBilgilerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
