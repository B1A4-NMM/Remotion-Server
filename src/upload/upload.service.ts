import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';

const unlinkAsync = util.promisify(fs.unlink);

@Injectable()
export class UploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadAudiosToS3(files: Array<Express.Multer.File>): Promise<{ success: boolean; urls: string[]; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No audio files uploaded.');
    }

    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const outputFileName = `combined_audio_${Date.now()}.mp3`;
    const outputPath = path.join(tempDir, outputFileName);

    return new Promise(async (resolve, reject) => {
      const command = ffmpeg();

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
            const fileBuffer = await util.promisify(fs.readFile)(outputPath);
            const uploadedFile = {
              buffer: fileBuffer,
              originalname: outputFileName,
              mimetype: 'audio/mpeg',
            } as Express.Multer.File;

            const audioUrl = await this.s3Service.uploadFile(uploadedFile);

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
          await unlinkAsync(outputPath).catch(() => {});
          for (const tempFilePath of tempFilePaths) {
            await unlinkAsync(tempFilePath).catch(() => {});
          }
          reject(new BadRequestException(`FFmpeg processing error: ${err.message}`));
        })
        .mergeToFile(outputPath, tempDir);
    });
  }
}
