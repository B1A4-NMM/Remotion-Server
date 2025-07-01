import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';
import { EmotionType, isEmotionType } from '../enums/emotion-type.enum';
import { EmotionAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { CommonUtilService } from '../util/common-util.service';
import { DiaryEmotion } from '../entities/diary-emotion.entity';
import { Diary } from '../entities/Diary.entity';

@Injectable()
export class EmotionService {
  constructor(
    @InjectRepository(EmotionTarget)
    private readonly emotionTargetRepository: Repository<EmotionTarget>,
    @InjectRepository(DiaryEmotion)
    private readonly diaryEmotionRepository: Repository<DiaryEmotion>,
    private readonly util: CommonUtilService,
  ) {}

  /**
   * emotion-target 엔티티 생성 함수
   */
  async createEmotionTarget(target: Target, dtos: EmotionAnalysisDto[]) {
    for (const dto of dtos) {
      const emotion = dto.emotionType; // 감정 타입
      const emotionIntensity = dto.intensity; // 감정 강도
      let find = await this.findOneEmotionTarget(target, emotion);
      if (find === null) {
        find = new EmotionTarget(
          this.util.parseEnumValue(EmotionType, emotion),
          target,
          emotionIntensity,
          1,
        );
      } else {
        find.emotion_intensity += emotionIntensity;
        find.count += 1;
      }

      await this.emotionTargetRepository.save(find);
    }
  }

  /**
   * diary-emotion 엔티티 생성 함수
   */
  async createDiaryEmotion(dtos: EmotionAnalysisDto[], diary: Diary) {
    for (const dto of dtos) {
      let entity = await this.findOneDiaryEmotion(diary, dto.emotionType);
      if (entity === null) {
        entity = new DiaryEmotion(diary, dto.emotionType, dto.intensity);
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
    return this.diaryEmotionRepository.findOneBy({
      diary: diary,
      emotion: emotion,
    });
  }

  /**
   * emotion-target 엔티티 찾는 함수
   */
  findOneEmotionTarget(target: Target, emotion: string) {
    if (!isEmotionType(emotion)) {
      throw new NotFoundException('emotion type is not valid');
    }

    return this.emotionTargetRepository.findOneBy({
      target: target,
      emotion: emotion,
    });
  }

  /**
   * 날짜와 멤버 아이디를 받아 해당 멤버가 해당하는 날짜에 쓴 일기에서
   * 추출 된 감정들을 가져옵니다
   * 이 때, 감정들이 같을 경우, 감정의 intensity의 합을 가져옵니다.
   */
  async sumIntensityByEmotionForDateAndOwner(date: string, ownerId: string) {
    return (
      this.diaryEmotionRepository
        .createQueryBuilder('de')
        // 감정 타입별로 묶어서 가져오기
        .select('de.emotion', 'emotion')
        .addSelect('SUM(de.intensity)', 'totalIntensity')
        // Diary와 조인
        .innerJoin('de.diary', 'd')
        // Diary.owner (또는 Diary.member) 와 조인
        .innerJoin('d.author', 'o')
        // 날짜 필터
        .where('d.written_date = :date', { date })
        // 소유자(owner)의 id 필터
        .andWhere('o.id = :ownerId', { ownerId })
        // 감정별 그룹화
        .groupBy('de.emotion')
        .getRawMany<{
          emotion: EmotionType;
          totalIntensity: string; // DB에서 숫자는 string으로
        }>()
    );
  }

  /**
   * Target을 인자로 받아, 해당 Target의 감정 중 가장 큰 것 하나만 반환합니다 
   */
  async highestEmotionToTarget(target: Target) {
    const row = await this.emotionTargetRepository
      .createQueryBuilder('et')
      // Target 테이블과 조인해서 필터
      .innerJoin('et.target', 't')
      // 감정 타입과 총합을 선택
      .select('et.emotion', 'emotion')
      .addSelect('SUM(et.emotion_intensity)', 'totalIntensity')
      // where t.id = :targetId
      .where('t.id = :targetId', { targetId: target.id })
      // 감정별 그룹화
      .groupBy('et.emotion')
      // intensity 합 기준 내림차순
      .orderBy('totalIntensity', 'DESC')
      // 가장 큰 것 한 건만
      .limit(1)
      // raw 결과로 가져오기
      .getRawOne<{ emotion: EmotionType; totalIntensity: string }>();

    // 없으면 null, 있으면 emotion 코드만 반환
    return row ? (row.emotion as EmotionType) : null;
  }

  async getTodayEmotions(memberId: string) {
    const date = this.util.getCurrentDate()
    return this.getEmotionsByDate(memberId, date)
  }

  private async getEmotionsByDate(memberId: string, date:string) {
    const emotions =
      await this.sumIntensityByEmotionForDateAndOwner(
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
}
