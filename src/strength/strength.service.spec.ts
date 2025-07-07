import { Test, TestingModule } from '@nestjs/testing';
import { StrengthService } from './strength.service';

describe('StrengthService', () => {
  let service: StrengthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StrengthService],
    }).compile();

    service = module.get<StrengthService>(StrengthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
