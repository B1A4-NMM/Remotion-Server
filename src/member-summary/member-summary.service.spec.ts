import { Test, TestingModule } from '@nestjs/testing';
import { MemberSummaryService } from './member-summary.service';

describe('MemberSummaryService', () => {
  let service: MemberSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberSummaryService],
    }).compile();

    service = module.get<MemberSummaryService>(MemberSummaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
