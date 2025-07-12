import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { S3Service } from './s3.service';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let s3Service: S3Service;
  let uploadService: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            uploadAudiosToS3: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    s3Service = module.get<S3Service>(S3Service);
    uploadService = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
