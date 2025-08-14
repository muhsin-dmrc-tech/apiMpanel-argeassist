import { Test, TestingModule } from '@nestjs/testing';
import { PersonelController } from './personel.controller';

describe('PersonelController', () => {
  let controller: PersonelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonelController],
    }).compile();

    controller = module.get<PersonelController>(PersonelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
