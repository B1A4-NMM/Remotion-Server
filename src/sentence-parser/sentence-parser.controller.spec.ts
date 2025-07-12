import { Test, TestingModule } from '@nestjs/testing';
import { SentenceParserController } from './sentence-parser.controller';
import { SentenceParserService } from './sentence-parser.service';

describe('SentenceParserController', () => {
  let controller: SentenceParserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SentenceParserController],
      providers: [SentenceParserService],
    }).compile();

    controller = module.get<SentenceParserController>(SentenceParserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
