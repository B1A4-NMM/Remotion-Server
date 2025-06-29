import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jController } from '../graph/neo4j.controller';
import { Neo4jService } from './neo4j.service';

describe('Neo4jController', () => {
  let controller: Neo4jController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Neo4jController],
      providers: [Neo4jService],
    }).compile();

    controller = module.get<Neo4jController>(Neo4jController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
