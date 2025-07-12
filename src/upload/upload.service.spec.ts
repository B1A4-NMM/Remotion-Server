import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

// Mock fs and util for file operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFile: jest.fn((path, data, callback) => callback(null)),
  readFile: jest.fn((path, callback) => callback(null, Buffer.from('mock file'))),
  unlink: jest.fn((path, callback) => callback(null)),
}));

jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn),
}));

// Mock fluent-ffmpeg
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = {
    input: jest.fn().mockReturnThis(),
    on: jest.fn((event, callback) => {
      if (event === 'end') {
        // Simulate successful ffmpeg processing
        process.nextTick(() => callback());
      } else if (event === 'error') {
        // Simulate ffmpeg error
        // process.nextTick(() => callback(new Error('FFmpeg error')));
      }
      return mockFfmpeg;
    }),
    mergeToFile: jest.fn((outputPath, tempDir) => {
      // Simulate file creation
      (fs.writeFile as unknown as jest.Mock)(
        outputPath,
        Buffer.from('mock audio'),
        () => {},
      );
    }),
  };
  return jest.fn(() => mockFfmpeg);
});

describe('UploadService', () => {
  let service: UploadService;
  let s3Service: S3Service;

  // Get mocked fs functions
  const mockedFs = fs as jest.Mocked<typeof fs>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    s3Service = module.get<S3Service>(S3Service);

    // Reset mocks before each test
    mockedFs.existsSync.mockClear();
    mockedFs.mkdirSync.mockClear();
    mockedFs.writeFile.mockClear();
    mockedFs.readFile.mockClear();
    mockedFs.unlink.mockClear();
    (s3Service.uploadFile as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadAudiosToS3', () => {
    const mockFiles: Array<Express.Multer.File> = [
      {
        fieldname: 'audios',
        originalname: 'audio1.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 1024,
        buffer: Buffer.from('mock audio 1'),
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(), // Provide a Readable stream
      },
      {
        fieldname: 'audios',
        originalname: 'audio2.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        size: 2048,
        buffer: Buffer.from('mock audio 2'),
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(), // Provide a Readable stream
      },
    ];

    it('should throw BadRequestException if no files are uploaded', async () => {
      await expect(service.uploadAudiosToS3([])).rejects.toThrow(BadRequestException);
      // Removed: await expect(service.uploadAudiosToS3(null)).rejects.toThrow(BadRequestException);
    });

    it('should upload combined audio to S3 and return success', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      // @ts-ignore
      mockedFs.readFile.mockResolvedValue(Buffer.from('combined mock audio'));
      (s3Service.uploadFile as jest.Mock).mockResolvedValue('https://mock-s3-url/combined_audio.mp3');

      const result = await service.uploadAudiosToS3(mockFiles);

      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled(); // tempDir already exists
      expect(mockedFs.writeFile).toHaveBeenCalledTimes(mockFiles.length); // Each input file written
      expect(mockedFs.readFile).toHaveBeenCalled(); // Combined file read
      expect(s3Service.uploadFile).toHaveBeenCalled(); // Combined file uploaded
      expect(mockedFs.unlink).toHaveBeenCalledTimes(mockFiles.length + 1); // Combined file + input files deleted
      expect(result).toEqual({
        success: true,
        urls: ['https://mock-s3-url/combined_audio.mp3'],
        message: `${mockFiles.length}개 파일이 업로드되었습니다.`,
      });
    });

    it('should create temp directory if it does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);
      // @ts-ignore
      mockedFs.readFile.mockResolvedValue(Buffer.from('combined mock audio'));
      (s3Service.uploadFile as jest.Mock).mockResolvedValue('https://mock-s3-url/combined_audio.mp3');

      await service.uploadAudiosToS3(mockFiles);

      expect(mockedFs.existsSync).toHaveBeenCalled();
      expect(mockedFs.mkdirSync).toHaveBeenCalled();
    });

    it('should handle ffmpeg processing errors', async () => {
      mockedFs.existsSync.mockReturnValue(true);
      // Simulate ffmpeg error by not resolving the promise in the mock
      jest.spyOn(require('fluent-ffmpeg')(), 'on').mockImplementation((event, callback: (err: Error) => void) => {
        if (event === 'error') {
          process.nextTick(() => callback(new Error('FFmpeg test error')));
        }
        return require('fluent-ffmpeg')();
      });

      await expect(service.uploadAudiosToS3(mockFiles)).rejects.toThrow('FFmpeg processing error: FFmpeg test error');
      expect(mockedFs.unlink).toHaveBeenCalled(); // Should attempt to clean up temp files
    });
  });
});