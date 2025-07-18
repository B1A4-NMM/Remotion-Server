import { Injectable, Logger } from '@nestjs/common';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryService } from '../diary/diary.service';
import { YoutubeService } from '../youtube/youtube.service';
import {
  EmotionGroup,
  EmotionType,
  getEmotionGroup,
} from '../enums/emotion-type.enum';
import { EMOTION_YOUTUBE_KEYWORDS } from '../constants/emotion-youtube.constant';
import { Member } from '../entities/Member.entity';
import { LocalDate } from 'js-joda';
import { ActivityClusterService } from '../activity-cluster/activity-cluster.service';
import { ClaudeService } from '../claude/claude.service';
import { ActivityService } from '../activity/activity.service';
import { getRandomComment } from '../constants/recommend-comment.constants';
import { CommonUtilService } from '../util/common-util.service';
import { Activity } from 'src/entities/Activity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendCommentRes } from './dto/recommend-comment.res';
import { numericPatterns } from 'date-fns/parse/_lib/constants';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    private readonly emotionService: EmotionService,
    private readonly diaryService: DiaryService,
    private readonly youtubeService: YoutubeService,
    private readonly activityClusterService: ActivityClusterService,
    private readonly LLMService: ClaudeService,
    private readonly activityService: ActivityService,
    private readonly utilService: CommonUtilService,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 유튜브 영상을 추천합니다.
   *
   */
  async getRecommendedVideoId(member: Member, periodDays: number) {
    // period를 periodDays로 변경하고 타입 number로 변경
    const memberId = member.id;

    // 1. 기간 파싱 및 다이어리 조회
    const endDate = LocalDate.now();
    const startDate = endDate.minusDays(periodDays);

    const emotionsDataByDate =
      await this.emotionService.getAllEmotionsGroupedByDateRange(
        memberId,
        startDate,
        endDate,
      );

    if (!emotionsDataByDate || emotionsDataByDate.length === 0) {
      this.logger.log(
        `No emotion data found for member ${memberId} in period of ${periodDays} days`,
      );
      return null;
    }

    // 2. 감정 집계 및 필터링
    const emotionCounts: Record<EmotionType, number> = {} as Record<
      EmotionType,
      number
    >;
    const youtubeEmotionTypes = Object.keys(
      EMOTION_YOUTUBE_KEYWORDS,
    ) as EmotionType[];

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

    if (!mostFrequentEmotion) {
      this.logger.log(
        `No relevant emotion found for member ${memberId} in period of ${periodDays} days`,
      );
      return null;
    }

    // 4. YoutubeService를 통해 videoId 받기
    const videoId =
      await this.youtubeService.getRandomVideoIdByEmotion(mostFrequentEmotion);

    if (!videoId) {
      this.logger.warn(
        `No YouTube video found for emotion type: ${mostFrequentEmotion}`,
      );
    }

    return { videoId, mostFrequentEmotion };
  }

  getCommentByWeekdayOfToday(memberId: string) {
    const date = LocalDate.now();
    return this.getCommentByWeekday(memberId, date);
  }

  getCommentByWeekdayOfTomorrow(memberId: string) {
    const date = LocalDate.now().plusDays(1);
    return this.getCommentByWeekday(memberId, date);
  }

  @Cron('0 9 * * *')
  async handleCronGetRecommendComment() {
    const today = LocalDate.now();
    const members = await this.memberRepo.find();
    members.forEach((member) => {
      this.getCommentByWeekday(member.id, today)
    })
  }

  /**
   * 각 요일마다 알맞은 추천 멘트를 줍니다
   */
  async getCommentByWeekday(memberId: string, date: LocalDate) {
    console.log("getCommentByWeekday: ", date.toString())
    const emotionGroup = await this.getMostFrequentEmotionGroupByWeekday(
      memberId,
      date,
    );
    let comment = '';
    if (emotionGroup === null) {
      return;
    }
    let recommendEmotion = EmotionGroup.안정;
    const dayOfWeek = date.dayOfWeek().toString().toLowerCase();
    switch (emotionGroup) {
      case EmotionGroup.스트레스:
        recommendEmotion = EmotionGroup.안정;
        break;
      case EmotionGroup.우울:
        recommendEmotion = EmotionGroup.활력;
        break;
      case EmotionGroup.불안:
        recommendEmotion = EmotionGroup.활력;
        break;
      default:
        return;
    }
    const clusters = await this.activityService.getActivitiesByEmotionGroup(
      memberId,
      recommendEmotion,
      10,
    );
    const activities = clusters.map((c) => {
      return { content: c.content, id: c.id };
    });

    const randomActivity = this.utilService.pickRandomUnique(activities, 1);
    comment = await this.LLMService.getRecommendComment(
      randomActivity[0].content,
      emotionGroup,
      dayOfWeek,
    );

    const selectActivity = await this.activityRepo.findOne({
      where: { id: randomActivity[0].id },
      relations: ['diary'],
    });

    if (!selectActivity) {
      // this.logger.warn(`No activity found for id: ${randomActivity[0].id}`);
      return;
    }

    await this.notificationService.createRecommendNotification(memberId, comment, selectActivity.diary.id);
  }

  private async getMostFrequentEmotionGroupByWeekday(
    memberId: string,
    date: LocalDate,
  ) {
    const emotionByWeekday =
      await this.emotionService.getAllEmotionsGroupByWeekday(memberId);
    const dayOfWeek = date.dayOfWeek().toString().toLowerCase();

    const emotions = emotionByWeekday[dayOfWeek];

    if (!emotions || emotions.length === 0) {
      return null; // 해당 요일에 감정 데이터가 없는 경우
    }

    const emotionGroupCounts: Record<EmotionGroup, number> = {} as Record<
      EmotionGroup,
      number
    >;

    // 각 감정의 count를 합산하여 그룹별 총 count를 계산합니다.
    for (const emotion of emotions) {
      const emotionGroup = getEmotionGroup(emotion.emotion as EmotionType);
      if (emotionGroup) {
        emotionGroupCounts[emotionGroup] =
          (emotionGroupCounts[emotionGroup] || 0) + emotion.count;
      }
    }

    let mostFrequentGroup: EmotionGroup | null = null;
    let maxCount = 0;

    for (const group in emotionGroupCounts) {
      if (emotionGroupCounts[group as EmotionGroup] > maxCount) {
        maxCount = emotionGroupCounts[group as EmotionGroup];
        mostFrequentGroup = group as EmotionGroup;
      }
    }

    return mostFrequentGroup;
  }
}
