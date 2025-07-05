import { Test, TestingModule } from '@nestjs/testing';
import { AchievementClusterService } from './achievement-cluster.service';

describe('AchievementClusterService', () => {
  let service: AchievementClusterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AchievementClusterService],
    }).compile();

    service = module.get<AchievementClusterService>(AchievementClusterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
