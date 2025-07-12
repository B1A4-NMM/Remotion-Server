import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@Controller('upload')
@ApiExcludeController()
export class UploadController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly uploadService: UploadService,
  ) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.s3Service.uploadFile(file);
    return { imageUrl };
  }

  @Post('audios')
  @UseInterceptors(FilesInterceptor('audios'))
  async uploadAudios(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.uploadService.uploadAudiosToS3(files);
  }

  @Post('multiple-images')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    const imageUrls = await this.s3Service.uploadMultipleFiles(files);
    return { imageUrls };
  }
}