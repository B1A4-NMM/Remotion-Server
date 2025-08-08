import { EmotionType } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { LocalDate } from 'js-joda';
import { Diary } from '../../entities/Diary.entity';
import { IsEncrypted } from '../../pipe/is-encrypted.decorator';

export class EmotionRes {
  @ApiProperty({
    enum: EmotionType,
    example: '행복',
    description: '감정 종류',
  })
  emotion: EmotionType;

  @ApiProperty({
    example: 5,
    description: '감정 강도',
  })
  intensity: number;

  constructor(emotion: EmotionType, intensity: number) {
    this.emotion = emotion;
    this.intensity = intensity;
  }
}

export class DiaryRes {
  @ApiProperty({ example: 1, description: '일기 ID' })
  diaryId: number;

  @ApiProperty({
    example: '커피를 마시며 여유로웠던 하루',
    description: '일기 제목',
  })
  title: string;

  @ApiProperty({ example: '2023-12-25', description: '일기 작성일' })
  writtenDate: LocalDate;

  @ApiProperty({ example: '아 코딩하기 귀찮다', description: '일기 내용' })
  @IsEncrypted()
  content: string;

  @ApiProperty({
    type: [String]
    ,example: ['s3://remotion-photo/bcdc2b34-a81e-4d51-be65-d14c4423e193.jpg', 's3://remotion-photo/asdqweasd-ajshe-jai23.jpg'],
    description: '사진 경로들',
  })
  photoPath?: string[] | null = [];

  @ApiProperty({
    example: 's3://remotion-photo/69846643-6af1-4a79-b8b1-6ac134d.mp3',
    description: '음성 녹음 경로',
  })
  audioPath?: string | null;

  @ApiProperty({ example: 'false', description: '북마크 여부' })
  isBookmarked: boolean;

  @ApiProperty({ example: '36.523', description: '위도' })
  latitude?: number | null = null;

  @ApiProperty({ example: '123.123', description: '경도' })
  longitude?: number | null = null;

  @ApiProperty({
    type: [String],
    example: ['코딩하기', '밥먹기'],
    description: '활동들',
  })
  activities: string[] = [];

  @ApiProperty({
    type: [EmotionRes],
    description: '일기에 포함된 감정들, 감정의 강도와 같이 보냅니다',
  })
  emotions: EmotionRes[] = [];

  @ApiProperty({
    type: [String],
    example: ['김민수', '이영희'],
    description: '일기에 포함된 대상들',
  })
  targets: string[] = [];

  constructor(diary:Diary, activities:string[] ,emotions:EmotionRes[], targets:string[]) {
    this.diaryId = diary.id
    this.title = diary.title
    this.writtenDate = diary.written_date
    this.content = diary.content
    this.photoPath = diary.photo_path
    this.audioPath = diary.audio_path
    this.latitude = diary.latitude
    this.longitude = diary.longitude
    this.activities = activities
    this.emotions = emotions
    this.targets = targets
    this.isBookmarked = diary.is_bookmarked
  }
}

export class DiaryHomeListRes {
  @ApiProperty({ type: [DiaryRes], description: '일기 목록' })
  diaries: DiaryRes[] = [];

  @ApiProperty({ example: 0, description: '일기 연속 작성 일자' })
  continuousWritingDate: number;

  @ApiProperty({ example: 10, description: '총 기록한 일기의 수' })
  totalDiaryCount: number;

  @ApiProperty({ example: 30, description: '이달의 감정 수' })
  emotionCountByMonth: number;
}
