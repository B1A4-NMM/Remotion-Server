import { Activity } from '../../entities/Activity.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RecommendCommentRes {
  @ApiProperty({ description: '일기 ID' })
  diaryId: number;

  @ApiProperty({ description: '활동 내용' })
  activity: string;

  @ApiProperty({ description: '추천 코멘트' })
  comment: string;

  constructor(activity: Activity, comment: string) {
    this.comment = comment;
    this.diaryId = activity.diary.id;
    this.activity = activity.content;
  }
}
