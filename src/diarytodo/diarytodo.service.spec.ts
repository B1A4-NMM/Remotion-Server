import { Test, TestingModule } from '@nestjs/testing';
import { DiarytodoService } from './diarytodo.service';

describe('DiarytodoService', () => {
  let service: DiarytodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiarytodoService],
    }).compile();

    service = module.get<DiarytodoService>(DiarytodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
