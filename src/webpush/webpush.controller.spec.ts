import { Test, TestingModule } from '@nestjs/testing';
import { WebpushController } from './webpush.controller';
import { WebpushService } from './webpush.service';

describe('WebpushController', () => {
  let controller: WebpushController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebpushController],
      providers: [WebpushService],
    }).compile();

    controller = module.get<WebpushController>(WebpushController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
