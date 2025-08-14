import { Test, TestingModule } from '@nestjs/testing';
import { PdfAnalizController } from './pdf-analiz.controller';

describe('PdfAnalizController', () => {
  let controller: PdfAnalizController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfAnalizController],
    }).compile();

    controller = module.get<PdfAnalizController>(PdfAnalizController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
