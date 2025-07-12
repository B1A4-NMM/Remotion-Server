import { Test, TestingModule } from '@nestjs/testing';
import { ActivityClusterController } from './activity-cluster.controller';

describe('ActivityClusterController', () => {
  let controller: ActivityClusterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityClusterController],
    }).compile();

    controller = module.get<ActivityClusterController>(ActivityClusterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
