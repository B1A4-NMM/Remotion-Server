import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';
import {
  EmotionBase, EmotionGroup,
  EmotionType,
  isEmotionType,
} from '../enums/emotion-type.enum';
import { EmotionAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { CommonUtilService } from '../util/common-util.service';
import { DiaryEmotion } from '../entities/diary-emotion.entity';
import { Diary } from '../entities/Diary.entity';
import { Emotions, EmotionSummaryWeekdayRes } from '../member/dto/emotion-summary-weekday.res';
import { weekday } from '../constants/weekday.constant';
import { LocalDate } from 'js-joda';
import { CombinedEmotion, EmotionInteraction } from '../util/json.parser';

@Injectable()
export class EmotionService {
  constructor(
    @InjectRepository(EmotionTarget)
    private readonly emotionTargetRepository: Repository<EmotionTarget>,
    @InjectRepository(DiaryEmotion)
    private readonly diaryEmotionRepository: Repository<DiaryEmotion>,
    private readonly util: CommonUtilService,

    @InjectRepository(Diary)
    private readonly diaryRepository : Repository<Diary>,
  ) {}
  
  async getEmotionSummaryPeriod(memberId: string, period: number) {
    const today = LocalDate.now();
    const pastDate = today.minusDays(period);
    
    const diaries = await this.diaryRepository.find({
      where: {
        author: { id: memberId },
        written_date: Between(pastDate, today)
      },
      relations: ['diaryEmotions', 'activities', 'diaryTargets', 'diaryTargets.target', 'diaryTargets.target.emotionTargets']
    });
    
  }

  /**
   * 기간을 인자로 받아 해당 기간 내에 등장한 감정들이 어떤 요일에 등장했는지 반환
   */
  async getEmotionSummaryWeekDay(memberId: string, period: number) {
    const today = LocalDate.now();
    const pastDate = today.minusDays(period);

    const diaries = await this.diaryRepository.find({
      where: {
        author: { id: memberId },
        written_date: Between(pastDate, today),
      },
      relations: ['diaryEmotions'],
    });

    const res = new EmotionSummaryWeekdayRes();
    for (const diary of diaries) {
      const dayIndex = diary.written_date.dayOfWeek().value();
      const dayName = weekday[dayIndex] as keyof EmotionSummaryWeekdayRes;

      for (const diaryEmotion of diary.diaryEmotions) {
        const emotionType = diaryEmotion.emotion;
        const dayArray = res[dayName] as Emotions[];

        if (!dayArray) continue

        const existingEmotion = dayArray.find((e) => e.emotion === emotionType);

        if (existingEmotion) {
          existingEmotion.count++;
        } else {
          dayArray.push({ emotion: emotionType, count: 1 });
        }
      }
    }
    return res;
  }

  /**
   * emotion-target 엔티티 생성 함수
   */
  async createOrUpdateEmotionTarget(
    target: Target,
    emotions: CombinedEmotion[],
  ) {
    for (const dto of emotions) {
      const emotion = dto.emotion;
      const emotionIntensity = dto.intensity;
      let find = await this.findOneEmotionTarget(target, emotion);
      if (find === null) {
        find = new EmotionTarget(emotion, target, emotionIntensity, 1);
      } else {
        find.emotion_intensity += emotionIntensity;
        find.count += 1;
      }

      await this.emotionTargetRepository.save(find);
    }
  }

  /**
   * diary-relation-emotion 엔티티 생성 함수
   */
  async createDiaryEmotionForTarget(emotions: CombinedEmotion[], diary: Diary) {
    return this.createDiaryEmotionByBase(emotions, diary, EmotionBase.Relation);
  }

  /**
   * diary-self-emotion 생성 함수
   */
  async createDiarySelfEmotion(emotions: CombinedEmotion[], diary: Diary) {
    return this.createDiaryEmotionByBase(emotions, diary, EmotionBase.Self);
  }

  /**
   * diary-state-emotion 생성 함수
   */
  async createDiaryStateEmotion(emotions: CombinedEmotion[], diary: Diary) {
    return this.createDiaryEmotionByBase(emotions, diary, EmotionBase.State);
  }

  async createDiaryEmotionByBase(
    emotions: CombinedEmotion[],
    diary: Diary,
    emotionBase: EmotionBase,
  ) {
    for (const emotion of emotions) {
      let entity = await this.findOneDiaryEmotion(diary, emotion.emotion);
      if (entity === null) {
        entity = new DiaryEmotion(
          diary,
          emotion.emotion,
          emotionBase,
          emotion.intensity,
        );
      } else {
        entity.intensity += emotion.intensity;
      }
      await this.diaryEmotionRepository.save(entity);
    }
  }

  /**
   * diary-emotion 찾는 함수
   */
  findOneDiaryEmotion(diary: Diary, emotion: EmotionType) {
    if (!isEmotionType(emotion)) {
      throw new NotFoundException('emotion type is not valid');
    }
    return this.diaryEmotionRepository.findOne({
      where: {
        diary: { id: diary.id },
        emotion: emotion,
      },
    });
  }

  /**
   * emotion-target 엔티티 찾는 함수
   */
  async findOneEmotionTarget(target: Target, emotion: EmotionType) {
    if (!isEmotionType(emotion)) {
      throw new NotFoundException('emotion type is not valid');
    }

    return await this.emotionTargetRepository.findOne({
      where: {
        target: { id: target.id },
        emotion,
      },
      relations: ['target'],
    });
  }

  /**
   * 날짜와 멤버 아이디를 받아 해당 멤버가 해당하는 날짜에 쓴 일기에서
   * 추출 된 감정들을 가져옵니다
   * 이 때, 감정들이 같을 경우, 감정의 intensity의 합을 가져옵니다.
   * 
   * 
   * 캘린더에서 이거 쓰면 될 듯
   */
  async sumIntensityByEmotionForDateAndOwner(date: string, ownerId: string) {
    return (
      this.diaryEmotionRepository
        .createQueryBuilder('de')
        .select('de.emotion', 'emotion')
        .addSelect('SUM(de.intensity)', 'totalIntensity')
        .innerJoin('de.diary', 'd')
        .innerJoin('d.author', 'o')
        .where('d.written_date = :date', { date })
        .andWhere('o.id = :ownerId', { ownerId })
        .groupBy('de.emotion')
        .getRawMany<{
          emotion: EmotionType;
          totalIntensity: string;
        }>()
    );
  }

  /**
   * Target을 인자로 받아, 해당 Target의 감정 중 가장 큰 것 하나만 반환합니다
   */
  async highestEmotionToTarget(target: Target) {
    const row = await this.emotionTargetRepository
      .createQueryBuilder('et')
      .innerJoin('et.target', 't')
      .select('et.emotion', 'emotion')
      .addSelect('SUM(et.emotion_intensity)', 'totalIntensity')
      .where('t.id = :targetId', { targetId: target.id })
      .groupBy('et.emotion')
      .orderBy('totalIntensity', 'DESC')
      .limit(1)
      .getRawOne<{ emotion: EmotionType; totalIntensity: string }>();

    return row ? (row.emotion as EmotionType) : null;
  }

  async getTodayEmotions(memberId: string) {
    const date = LocalDate.now().toString();
    return this.getEmotionsByDate(memberId, date);
  }

  private async getEmotionsByDate(memberId: string, date: string) {
    const emotions = await this.sumIntensityByEmotionForDateAndOwner(
      date,
      memberId,
    );
    const result: any[] = [];
    for (const r of emotions) {
      result.push({
        emotion: r.emotion,
        intensity: parseFloat(r.totalIntensity),
      });
    }

    return result;
  }


  // 감정 추출하는 로직인데 특정 날짜의 추출 감정들중 intensity 가장 높은거

  async getRepresentEmotionByDiary(diaryId : number) : Promise<EmotionType | null> {
    const diary = await this.diaryRepository.findOne({

      where: { id : diaryId },
      relations  : ['diaryEmotions'],
      
    });

    if( !diary || !diary.diaryEmotions.length) return null; 

    const sorted = diary.diaryEmotions.sort( (a,b) => b.intensity - a.intensity);
    return sorted[0].emotion; 
  }

  

   //특정 날짜 범위에 있는 모든 감정들 추출해서 보내주기
   //비동기,병렬 처리 
   async getAllEmotionsGroupedByDateRange(userId: string, from: string, to: string) {

    const startDate = new Date(from);
    const endDate = new Date(to);
    const dates: string[] = [];

    //날짜 범위 내 모든 날짜 문자열로 저장
    while (startDate <= endDate) {
      const isoDate = startDate.toISOString().split('T')[0];
      dates.push(isoDate);
      startDate.setDate(startDate.getDate() + 1);
    }

    //병렬 처리로 모든 날짜에 대해 감정 데이터 조회
    const emotionPromises =dates.map(async (date) => {
      const emotions =await this.getEmotionsByDate(userId,date);

      return { date,emotions }; // 날짜별로 묶인 결과 반환


    });

    const results =await Promise.all(emotionPromises);
    
    return results;
  }
  

   
}
