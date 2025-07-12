import { Injectable, Logger } from '@nestjs/common';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryService } from '../diary/diary.service';
import { YoutubeService } from '../youtube/youtube.service';
import { EmotionType } from '../enums/emotion-type.enum';
import { EMOTION_YOUTUBE_KEYWORDS } from '../constants/emotion-youtube.constant';
import { Member } from '../entities/Member.entity';
import { LocalDate } from 'js-joda';

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    private readonly emotionService: EmotionService,
    private readonly diaryService: DiaryService,
    private readonly youtubeService: YoutubeService,
  ) {}

  async getRecommendedVideoId(member: Member, periodDays: number) { // period를 periodDays로 변경하고 타입 number로 변경
    const memberId = member.id;

    // 1. 기간 파싱 및 다이어리 조회
    const startDate = LocalDate.now()
    const endDate = startDate.minusDays(periodDays)

    const emotionsDataByDate = await this.emotionService.getAllEmotionsGroupedByDateRange(
      memberId,
      startDate,
      endDate,
    );

    if (!emotionsDataByDate || emotionsDataByDate.length === 0) {
      this.logger.log(`No emotion data found for member ${memberId} in period of ${periodDays} days`);
      return null;
    }

    // 2. 감정 집계 및 필터링
    const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    const youtubeEmotionTypes = Object.keys(EMOTION_YOUTUBE_KEYWORDS) as EmotionType[];

    for (const dailyData of emotionsDataByDate) {
      for (const emotionDetail of dailyData.emotions) {
        const emotionType = emotionDetail.emotion;

        if (youtubeEmotionTypes.includes(emotionType)) {
          emotionCounts[emotionType] = (emotionCounts[emotionType] || 0) + 1;
        }
      }
    }

    // 3. 가장 높은 감정 선택
    let mostFrequentEmotion: EmotionType | null = null;
    let maxCount = 0;

    for (const emotionType in emotionCounts) {
      if (emotionCounts[emotionType as EmotionType] > maxCount) {
        maxCount = emotionCounts[emotionType as EmotionType];
        mostFrequentEmotion = emotionType as EmotionType;
      }
    }

    console.log(`가장 많은 감정 = ${mostFrequentEmotion}`)

    if (!mostFrequentEmotion) {
      this.logger.log(`No relevant emotion found for member ${memberId} in period of ${periodDays} days`);
      return null;
    }

    // 4. YoutubeService를 통해 videoId 받기
    const videoId = await this.youtubeService.getRandomVideoIdByEmotion(mostFrequentEmotion);

    if (!videoId) {
      this.logger.warn(`No YouTube video found for emotion type: ${mostFrequentEmotion}`);
    }

    return { videoId, mostFrequentEmotion };
  }

}
