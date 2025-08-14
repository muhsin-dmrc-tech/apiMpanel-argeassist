import { Test, TestingModule } from '@nestjs/testing';
import { GrupYetkileriController } from './grup-yetkileri.controller';

describe('GrupYetkileriController', () => {
  let controller: GrupYetkileriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrupYetkileriController],
    }).compile();

    controller = module.get<GrupYetkileriController>(GrupYetkileriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
