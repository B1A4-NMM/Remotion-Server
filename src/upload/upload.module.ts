// src/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';

@Module({
  imports: [],
  controllers: [UploadController],
  providers: [UploadService, S3Service],
  exports: [UploadService, S3Service]
})
export class UploadModule {}
