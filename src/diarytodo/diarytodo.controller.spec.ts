import { Test, TestingModule } from '@nestjs/testing';
import { DiarytodoController } from './diarytodo.controller';
import { DiarytodoService } from './diarytodo.service';

describe('DiarytodoController', () => {
  let controller: DiarytodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiarytodoController],
      providers: [DiarytodoService],
    }).compile();

    controller = module.get<DiarytodoController>(DiarytodoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
