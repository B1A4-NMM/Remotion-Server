import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';
import {
  EmotionBase,
  EmotionType,
  isEmotionType,
} from '../enums/emotion-type.enum';
import { EmotionAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { CommonUtilService } from '../util/common-util.service';
import { DiaryEmotion } from '../entities/diary-emotion.entity';
import { Diary } from '../entities/Diary.entity';
import { Emotions, EmotionSummaryWeekdayRes } from '../member/dto/emotion-summary-weekday.res';
import { weekday } from '../constants/weekday.constant';
import { LocalDate } from 'js-joda';

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
    dtos: EmotionAnalysisDto[],
  ) {
    for (const dto of dtos) {
      const emotion = dto.emotionType;
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
  async createDiaryEmotionForTarget(dtos: EmotionAnalysisDto[], diary: Diary) {
    return this.createDiaryEmotionByBase(dtos, diary, EmotionBase.Relation);
  }

  /**
   * diary-self-emotion 생성 함수
   */
  async createDiarySelfEmotion(dtos: EmotionAnalysisDto[], diary: Diary) {
    return this.createDiaryEmotionByBase(dtos, diary, EmotionBase.Self);
  }

  /**
   * diary-state-emotion 생성 함수
   */
  async createDiaryStateEmotion(dtos: EmotionAnalysisDto[], diary: Diary) {
    return this.createDiaryEmotionByBase(dtos, diary, EmotionBase.State);
  }

  async createDiaryEmotionByBase(
    dtos: EmotionAnalysisDto[],
    diary: Diary,
    emotionBase: EmotionBase,
  ) {
    for (const dto of dtos) {
      let entity = await this.findOneDiaryEmotion(diary, dto.emotionType);
      if (entity === null) {
        entity = new DiaryEmotion(
          diary,
          dto.emotionType,
          emotionBase,
          dto.intensity,
        );
      } else {
        entity.intensity += dto.intensity;
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
}
