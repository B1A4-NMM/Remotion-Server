import { Test, TestingModule } from '@nestjs/testing';
import { WebpushService } from './webpush.service';

describe('WebpushService', () => {
  let service: WebpushService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebpushService],
    }).compile();

    service = module.get<WebpushService>(WebpushService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
