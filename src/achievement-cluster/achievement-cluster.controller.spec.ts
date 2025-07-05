import { Test, TestingModule } from '@nestjs/testing';
import { AchievementClusterController } from './achievement-cluster.controller';
import { AchievementClusterService } from './achievement-cluster.service';

describe('AchievementClusterController', () => {
  let controller: AchievementClusterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementClusterController],
      providers: [AchievementClusterService],
    }).compile();

    controller = module.get<AchievementClusterController>(AchievementClusterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
