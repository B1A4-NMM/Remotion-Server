import { Injectable, Logger } from '@nestjs/common';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryService } from '../diary/diary.service';
import { YoutubeService } from '../youtube/youtube.service';
import { EmotionType } from '../enums/emotion-type.enum';
import { EMOTION_YOUTUBE_KEYWORDS } from '../constants/emotion-youtube.constant';
import { Member } from '../entities/Member.entity';

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    private readonly emotionService: EmotionService,
    private readonly diaryService: DiaryService,
    private readonly youtubeService: YoutubeService,
  ) {}

  async getRecommendedVideoId(member: Member, periodDays: number): Promise<string[] | null> { // period를 periodDays로 변경하고 타입 number로 변경
    const memberId = member.id;

    // 1. 기간 파싱 및 다이어리 조회
    const { startDate, endDate } = this.parsePeriod(periodDays); // periodDays 전달
    if (!startDate || !endDate) {
      this.logger.warn(`Invalid periodDays: ${periodDays}`);
      return null;
    }

    const emotionsDataByDate = await this.emotionService.getAllEmotionsGroupedByDateRange(
      memberId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
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

    return videoId;
  }

  private parsePeriod(periodDays: number): { startDate: Date | null; endDate: Date | null } {
    const now = new Date();
    const endDate = new Date(now); // 현재 시간까지

    // 오늘로부터 periodDays일 전의 날짜 계산
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - periodDays);

    // startDate의 시간을 00:00:00으로 설정하여 날짜 시작부터 포함
    startDate.setHours(0, 0, 0, 0);
    // endDate의 시간을 23:59:59으로 설정하여 날짜 끝까지 포함
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
}
