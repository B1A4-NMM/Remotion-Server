import { ApiProperty } from '@nestjs/swagger';
import { LocalDate } from 'js-joda';

export class PhotoDetailDto {
  @ApiProperty({ description: '일기 ID' })
  diaryId: number;

  @ApiProperty({ description: '일기 작성일' })
  writtenDate: LocalDate;

  @ApiProperty({ description: '사진 URL' })
  photoUrl: string;

  constructor(diaryId: number, writtenDate: LocalDate, photoUrl: string) {
    this.diaryId = diaryId;
    this.writtenDate = writtenDate;
    this.photoUrl = photoUrl;
  }
}
