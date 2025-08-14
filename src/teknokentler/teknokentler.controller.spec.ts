import { Test, TestingModule } from '@nestjs/testing';
import { TeknokentlerController } from './teknokentler.controller';

describe('TeknokentlerController', () => {
  let controller: TeknokentlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeknokentlerController],
    }).compile();

    controller = module.get<TeknokentlerController>(TeknokentlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
