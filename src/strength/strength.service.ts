import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LocalDate } from 'js-joda';

import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryService } from '../diary/diary.service';

import { Diary } from '../entities/Diary.entity';
import { Activity } from '../entities/Activity.entity';
import {
  StrengthType,
  strengthCategoryMap,
} from 'src/enums/strength-type.enum';
import { GetStrengthsResponseDto } from './dto/get-strengths-response.dto';

@Injectable()
export class StrengthService {
  private readonly logger = new Logger(StrengthService.name);

  constructor(
    private readonly memberService: MemberService,
    private readonly emotionService: EmotionService,
    private readonly diaryService: DiaryService,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getStrengthsSummaryByMember(
    memberId: string,
  ): Promise<GetStrengthsResponseDto> {
    //DB조회는 비동기 처리(not 병렬)
    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin('activity.diary', 'diary')
      .innerJoin('diary.author', 'author')
      .where('author.id = :memberId', { memberId })
      .getMany();

    const typeCount: Record<string, number> = {};
    const detailCount: Record<string, Record<string, number>> = {};

    for (const activity of activities) {
      /*
      -메모리 상에 있는 배열(activities) 반복
      -activity의 strength를 꺼낸다 
      */
      if (!activity.strength) continue;

      const strength = activity.strength as StrengthType;
      const type = strengthCategoryMap[strength];

      //for문 돌면서 카운트 +1 해준다.

      //typeCount(유형별 총 개수)
      if (type) {
        //1.유형별 상세 카운트 초기화 및 증가
        if (!detailCount[type]) {
          detailCount[type] = {};
        }
        detailCount[type][strength] = (detailCount[type][strength] || 0) + 1;
      }
      typeCount[type] = (typeCount[type] || 0) + 1;
    }

    return new GetStrengthsResponseDto(typeCount, detailCount);
  }

  /**
   * 해당 기간 내의 강점들을 모두 집계하여 가져옵니다
   */
  async getStrengthsCountByPeriod(
    memberId: string,
    startDate: LocalDate,
    endDate: LocalDate,
  ): Promise<GetStrengthsResponseDto> {
    // 1. 기간 내의 diary에서 나타난 activity를 모두 가져옵니다.
    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin('activity.diary', 'diary')
      .innerJoin('diary.author', 'author')
      .where('author.id = :memberId', { memberId })
      .andWhere('diary.written_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toString(),
        endDate: endDate.toString(),
      })
      .getMany();

    // 2. activity의 strength들을 모두 가져와 StrengthCategory으로 그룹화하여 카운트를 셉니다.
    const typeCount: Record<string, number> = {};
    const detailCount: Record<string, Record<string, number>> = {};

    for (const activity of activities) {
      if (activity.strength) {
        const strength = activity.strength as StrengthType;
        const category = strengthCategoryMap[strength];

        if (category) {
          // 카테고리별 개수 증가
          typeCount[category] = (typeCount[category] || 0) + 1;

          // 상세 강점 개수 증가
          if (!detailCount[category]) {
            detailCount[category] = {};
          }
          detailCount[category][strength] =
            (detailCount[category][strength] || 0) + 1;
        }
      }
    }

    // 3. GetStrengthsResponseDto 형식으로 묶어서 반환합니다.
    return new GetStrengthsResponseDto(typeCount, detailCount);
  }

  /**
   * 연도와 월을 받아 해당 기간 내의 강점 집계를 반환합니다.
   */
  async getStrengthsCountByMonth(
    memberId: string,
    year: number,
    month: number,
  ): Promise<GetStrengthsResponseDto> {
    // 해당 월의 첫 날과 마지막 날을 계산합니다.
    const startDate = LocalDate.of(year, month, 1);
    const endDate = startDate.plusMonths(1).minusDays(1);

    // 기존 함수를 호출하여 결과를 반환합니다.
    return this.getStrengthsCountByPeriod(memberId, startDate, endDate);
  }
}
