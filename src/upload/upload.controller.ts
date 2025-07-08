import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'; // FilesInterceptor 추가
import { S3Service } from '../s3/s3.service';
import { ApiExcludeController } from '@nestjs/swagger';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';

const unlinkAsync = util.promisify(fs.unlink); // 추가

@Controller('upload')
@ApiExcludeController()
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.s3Service.uploadFile(file);
    return { imageUrl };
  }

  @Post('audios')
  @UseInterceptors(FilesInterceptor('audios')) // 'audios' 필드명으로 여러 파일 받음
  async uploadAudios(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No audio files uploaded.');
    }

    const tempDir = path.join(__dirname, '..', '..', 'temp'); // 임시 파일 저장 경로
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const outputFileName = `combined_audio_${Date.now()}.mp3`; // 출력 파일명
    const outputPath = path.join(tempDir, outputFileName);

    return new Promise(async (resolve, reject) => {
      const command = ffmpeg();

      // 각 파일을 임시로 저장하고 ffmpeg 입력으로 추가
      const tempFilePaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const tempFilePath = path.join(tempDir, `input_${Date.now()}_${i}${path.extname(files[i].originalname)}`);
        await util.promisify(fs.writeFile)(tempFilePath, files[i].buffer);
        tempFilePaths.push(tempFilePath);
        command.input(tempFilePath);
      }

      command
        .on('end', async () => {
          try {
            // S3에 업로드
            const fileBuffer = await util.promisify(fs.readFile)(outputPath);
            const uploadedFile = {
              buffer: fileBuffer,
              originalname: outputFileName,
              mimetype: 'audio/mpeg', // 또는 'audio/mp3'
            } as Express.Multer.File;

            const audioUrl = await this.s3Service.uploadFile(uploadedFile);

            // 임시 파일 삭제
            await unlinkAsync(outputPath);
            for (const tempFilePath of tempFilePaths) {
              await unlinkAsync(tempFilePath);
            }

            resolve({
              success: true,
              urls: [audioUrl],
              message: `${files.length}개 파일이 업로드되었습니다.`,
            });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', async (err) => {
          // 에러 발생 시 임시 파일 삭제
          await unlinkAsync(outputPath).catch(() => {}); // 에러 무시
          for (const tempFilePath of tempFilePaths) {
            await unlinkAsync(tempFilePath).catch(() => {}); // 에러 무시
          }
          reject(new BadRequestException(`FFmpeg processing error: ${err.message}`));
        })
        .mergeToFile(outputPath, tempDir); // 임시 디렉토리에 합쳐진 파일 저장
    });
  }
}