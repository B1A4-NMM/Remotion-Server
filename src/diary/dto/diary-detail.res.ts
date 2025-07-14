import { Diary } from '../../entities/Diary.entity';
import { LocalDate } from 'js-joda';
import { ApiProperty } from '@nestjs/swagger';

export class DiaryDetailRes {
  @ApiProperty({ description: '다이어리 ID' })
  id: number;

  @ApiProperty({ description: '다이어리 작성 날짜' })
  writtenDate: LocalDate;

  @ApiProperty({ description: '사진 경로 목록', type: [String] })
  photoPath: string[] = [];

  @ApiProperty({
    description: '음성파일 경로',
    required: false,
    nullable: true,
  })
  audiosPath?: string | null;

  @ApiProperty({ description: '다이어리 내용' })
  content: string;

  @ApiProperty({ description: '위도', required: false, nullable: true })
  latitude?: number | null;

  @ApiProperty({ description: '경도', required: false, nullable: true })
  longitude?: number | null;

  @ApiProperty({ description: '다이어리 분석 내용' })
  analysis: string;

  constructor(diary: Diary) {
    this.id = diary.id;
    this.writtenDate = diary.written_date;
    this.photoPath = diary.photo_path ?? [];
    this.audiosPath = diary.audio_path;
    this.content = diary.content;
    this.latitude = diary.latitude;
    this.longitude = diary.longitude;
    this.analysis = diary.metadata;
  }
}
