import { Test, TestingModule } from '@nestjs/testing';
import { StrengthController } from './strength.controller';
import { StrengthService } from './strength.service';

describe('StrengthController', () => {
  let controller: StrengthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrengthController],
      providers: [StrengthService],
    }).compile();

    controller = module.get<StrengthController>(StrengthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
