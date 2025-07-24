import { ApiProperty } from '@nestjs/swagger';
import { DiaryRes } from './diary-home-list.res';
import { Diary } from '../../entities/Diary.entity';
import { EmotionRes } from './diary-home.res';

export class searchDiaryInfo extends DiaryRes {
  @ApiProperty({
    example: '여행을 떠난 날',
    description: '검색어',
  })
  search_sentence: string;

  @ApiProperty({
    example: '나는 몽골로 떠나기로 했다',
    description: '검색어와 관련된 문장',
  })
  relate_sentence: string;

  constructor(
    diary: Diary,
    activities: string[],
    emotions: EmotionRes[],
    targets: string[],
    search_sentence: string,
    relate_sentence: string,
  ) {
    super(diary, activities, emotions, targets);
    this.search_sentence = search_sentence;
    this.relate_sentence = relate_sentence;

    const originalContent = diary.content;
    const relateSentenceIndex = originalContent.indexOf(relate_sentence);

    if (relateSentenceIndex !== -1) {
      const startIndex = Math.max(0, relateSentenceIndex - 20);
      const endIndex = Math.min(
        originalContent.length,
        relateSentenceIndex + relate_sentence.length + 70,
      );

      let slicedContent = originalContent.slice(startIndex, endIndex);

      if (startIndex > 0) {
        slicedContent = '...' + slicedContent;
      }

      if (endIndex < originalContent.length) {
        slicedContent = slicedContent + '...';
      }
      this.content = slicedContent;
    }
  }
}

export class SearchDiaryRes {
  @ApiProperty({ type: [searchDiaryInfo], description: '일기 목록' })
  diaries: searchDiaryInfo[] = [];

  @ApiProperty({ example: 10, description: '검색 일기 개수' })
  totalCount: number;
}
