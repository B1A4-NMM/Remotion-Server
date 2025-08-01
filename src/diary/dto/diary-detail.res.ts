import { Diary } from '../../entities/Diary.entity';
import { LocalDate } from 'js-joda';
import { ApiProperty } from '@nestjs/swagger';
import { EmotionScoresResDto } from './emotion-scores-res.dto';
import { Type } from 'class-transformer';
import { RecommendRoutineRes } from '../../routine/dto/recommend-routine.res';
import { DiaryAnalysisJson } from './diary-json.res';
import { EmotionRes } from './diary-home-list.res';

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
  audioPath?: string | null;

  @ApiProperty({
    description: '북마크 여부'
  })
  isBookmarked:boolean = false;

  @ApiProperty({description: '일기에 나타난 사람들'})
  people:{name:string, changeScore:number}[] = []

  @ApiProperty({ description: '다이어리 내용' })
  content: string;

  @ApiProperty({
    type: [EmotionRes],
    description: '일기에 포함된 감정들, 감정의 강도와 같이 보냅니다',
  })
  emotions: EmotionRes[] = [];

  @ApiProperty({ description: '위도', required: false, nullable: true })
  latitude?: number | null;

  @ApiProperty({ description: '경도', required: false, nullable: true })
  longitude?: number | null;

  @ApiProperty({description: '스트레스 경고', example: false})
  stressWarning: boolean;

  @ApiProperty({description: '불안 경고', example: false})
  anxietyWarning: boolean;

  @ApiProperty({description: '우울 경고', example: false})
  depressionWarning: boolean;

  @ApiProperty({description: '추천되는 루틴 반환', type: RecommendRoutineRes})
  recommendRoutine?:RecommendRoutineRes | null

  @ApiProperty({description: '지금 일기 + 이전 일기 10개 감정 스코어'})
  beforeDiaryScores:EmotionScoresResDto

  @ApiProperty({ description: '다이어리 분석 결과', type: DiaryAnalysisJson })
  @Type(() => DiaryAnalysisJson)
  analysis: DiaryAnalysisJson;

  constructor(diary: Diary) {
    this.id = diary.id;
    this.writtenDate = diary.written_date;
    this.isBookmarked = diary.is_bookmarked;
    this.photoPath = diary.photo_path ?? [];
    this.audioPath = diary.audio_path;
    this.content = diary.content;
    this.latitude = diary.latitude;
    this.longitude = diary.longitude;
    this.analysis = diary.metadata;
    this.people = diary.diaryTargets.map((dt) => {
      return {name:dt.target.name, changeScore:dt.changeScore}
    })
  }
}
