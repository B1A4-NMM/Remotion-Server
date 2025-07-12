import { Test, TestingModule } from '@nestjs/testing';
import { SentenceParserService } from './sentence-parser.service';

describe('SentenceParserService', () => {
  let service: SentenceParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SentenceParserService],
    }).compile();

    service = module.get<SentenceParserService>(SentenceParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
