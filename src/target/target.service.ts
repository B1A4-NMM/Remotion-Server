import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Target } from '../entities/Target.entity';
import { Repository } from 'typeorm';
import { Diary } from '../entities/Diary.entity';
import { MemberService } from '../member/member.service';
import { CommonUtilService } from '../util/common-util.service';
import { TargetRelation } from '../enums/target.enum';
import { DiaryTarget } from '../entities/diary-target.entity';
import { EmotionService } from '../emotion/emotion.service';
import { EmotionType } from '../enums/emotion-type.enum';
import { LocalDate, ChronoUnit } from 'js-joda';
import { CombinedEmotion, EmotionInteraction, Person } from '../util/json.parser';
import { Member } from '../entities/Member.entity';
import { ActivityTarget } from '../entities/ActivityTarget.entity';

@Injectable()
export class TargetService {
  constructor(
    @InjectRepository(Target)
    private readonly targetRepository: Repository<Target>,
    @InjectRepository(DiaryTarget)
    private readonly diaryTargetRepository: Repository<DiaryTarget>,
    @InjectRepository(ActivityTarget)
    private readonly activityTargetRepository: Repository<ActivityTarget>,
    private readonly memberService: MemberService,
    private readonly util: CommonUtilService,
    private readonly emotionService: EmotionService,
  ) {}

  /**
   * 대상이 최근에 언급된 빈도를 기반으로 점수를 반환하는 함수 (성능 개선 버전)
   */
  async getRecentMentionsScore(targetId: number): Promise<number> {
    const today = LocalDate.now();
    const oneWeekAgo = today.minusWeeks(1);
    const twoWeeksAgo = today.minusWeeks(2);
    const threeWeeksAgo = today.minusWeeks(3);

    // 최근 3주 동안의 모든 관련 기록을 날짜와 함께 조회
    const diaryTargets = await this.diaryTargetRepository
      .createQueryBuilder('diaryTarget')
      .innerJoin('diaryTarget.diary', 'diary')
      .addSelect('diary.written_date') // select에 written_date 추가
      .where('diaryTarget.target_id = :targetId', { targetId })
      .andWhere('diary.written_date >= :threeWeeksAgo', {
        threeWeeksAgo: threeWeeksAgo.toString(),
      })
      .getMany();

    if (diaryTargets.length === 0) {
      return 0; // 최근 3주 내 기록이 없으면 0점
    }

    let score = 0;
    for (const record of diaryTargets) {
      const writtenDate = record.diary.written_date;

      if (writtenDate.isAfter(oneWeekAgo) || writtenDate.isEqual(oneWeekAgo)) {
        score += 1; // 1주일 이내
      } else if (writtenDate.isAfter(twoWeeksAgo) || writtenDate.isEqual(twoWeeksAgo)) {
        score += 0.5; // 2주일 이내
      } else {
        score += 0.2; // 3주일 이내
      }
    }

    // 최대 점수는 5점으로 제한
    return Math.min(score, 5);
  }

  /**
   * 특정 대상과 관련된 활동 클러스터를 분석하는 함수
   * @param targetId 분석할 대상의 ID
   * @returns 활동 클러스터의 레이블과 개수를 담은 배열
   */
  async analyzeActivityClustersByTarget(targetId: number): Promise<{ content: string; count: number }[]> {
    // 1. targetId를 통해 모든 ActivityTarget을 조회합니다.
    const activityTargets = await this.activityTargetRepository.find({
      where: { target: { id: targetId } },
      relations: ['activity', 'activity.cluster'], // Activity와 ActivityCluster를 함께 로드합니다.
    });

    if (!activityTargets || activityTargets.length === 0) {
      // 관련된 활동이 없는 경우 빈 배열을 반환합니다.
      return [];
    }

    // 2. ActivityTarget을 통해 Activity를 가져오고, 연관된 ActivityCluster를 그룹핑합니다.
    const clusterCounts = new Map<string, number>();

    for (const at of activityTargets) {
      const activity = at.activity;
      if (activity && activity.cluster) {
        const cluster = activity.cluster;
        const label = cluster.label; // 클러스터의 레이블을 가져옵니다.

        // 3. 같은 클러스터끼리 그룹핑하여 count를 셉니다.
        clusterCounts.set(label, (clusterCounts.get(label) || 0) + 1);
      }
    }

    // 4. 그룹핑한 클러스터들의 count와 label을 [{content:label, count:count}] 형식으로 묶어서 배열로 반환합니다.
    const result = Array.from(clusterCounts.entries()).map(([label, count]) => ({
      content: label,
      count: count,
    }));

    return result;
  }

  /**
   * 일기에 나타난 대상을 저장하는 함수
   * 대상이 없다면 생성하고, 있다면 심적 거리나 최근 언급 일자를 갱신
   * 대상을 저장한 후, 대상에 나타난 감정을 같이 저장
   * 이후 다이어리-감정 엔티티도 같이 저장함 -> 수정이 필요할지도?
   */
  async createByDiary(people: Person[], diary: Diary, member: Member) {

    for (const person of people) {
      let target = await this.findOne(member.id, person.name);
      let calcClosenessScore = await this.calculateClosenessScore(person.interactions);
      if (target === null) {
        // 대상이 없다면 생성
        target = new Target(
          person.name,
          1,
          LocalDate.now(),
          TargetRelation.ETC,
          await this.calculateAffection(person.interactions),
          member,
          30 + calcClosenessScore,
        );
      } else {
        // 있으면 갱신
        target.affection += await this.calculateAffection(person.interactions);
        target.recent_date = LocalDate.now();
        target.count += 1;
        let score = target.closenessScore + calcClosenessScore
        if (score < 0) score = 0;
        if (score > 90) score = 90;
        target.closenessScore = score
        // DONE : emotionTarget도 갱신해야할듯
      }

      target = await this.targetRepository.save(target);
      await this.createDiaryTarget(target, diary, calcClosenessScore);

      const feelToTarget = this.util.toCombinedEmotionTyped(person.interactions);
      await this.emotionService.createOrUpdateEmotionTarget(
        target,
        feelToTarget,
        diary.written_date,
      );
    }

    const feelToTargetAll: CombinedEmotion[] = people.flatMap((p) => [
      ...this.util.toCombinedEmotionTyped(p.interactions),
    ]);

    await this.emotionService.createDiaryEmotionForTarget(
      feelToTargetAll,
      diary,
    );

  }

  /**
   * 해당 대상이 나타난 다이어리를 모두 반환합니다 
   */
  async getDiariesByTarget(targetId: number) {
    const diaries = await this.diaryTargetRepository.find({
      where: { target: {id : targetId} },
      relations: ['diary']
    })
    return diaries.map(diary => diary.diary)
  }

  async createDiaryTarget(target: Target, diary: Diary, changeScore:number) {
    let diaryTarget = await this.diaryTargetRepository.findOneBy({
      diary: {id : diary.id},
      target: {id : target.id},
    });
    if (diaryTarget === null) {
      diaryTarget = new DiaryTarget(diary, target);
      diaryTarget.changeScore = changeScore
    } else
      diaryTarget.changeScore += changeScore
    await this.diaryTargetRepository.save(diaryTarget);
  }

  async findOne(memberId:string, targetName: string) {
    return await this.targetRepository.findOneBy({
      member: {id : memberId},
      name: targetName,
    });
  }

  async findOneById(memberId:string, targetId: number) {
    let result = await this.targetRepository.findOne({
      where: {
        member: { id: memberId },
        id : targetId
      },
    });

    if (result === null) {
      throw new NotFoundException('[findOneById] 대상을 찾지 못했습니다')
    }

    return result;
  }

  async findAll(memberId: string) {
    const member = await this.memberService.findOne(memberId);

    const result = await this.targetRepository.find({
      where: { member: member },
      order: {
        affection: 'DESC',
      },
    });

    return result;
  }

  async calculateClosenessScore(emotions: EmotionInteraction) {
    let score = 0;

    const combinedEmotions = this.util.toCombinedEmotionTyped(emotions);

    for (const emotion of combinedEmotions) {
      const emotionType = emotion.emotion;
      const intensity = emotion.intensity;

      switch (emotionType) {
        // 긍정적 affection
        case EmotionType.사랑:
        case EmotionType.유대:
        case EmotionType.친밀:
        case EmotionType.애정:
        case EmotionType.존경:
          score += intensity / 6;
          break;

        case EmotionType.신뢰:
        case EmotionType.공감:
        case EmotionType.감사:
          score += intensity / 10;
          break;

        // 중립적 또는 애매한 영향
        case EmotionType.거부감:
        case EmotionType.시기:
        case EmotionType.질투:
        case EmotionType.실망:
        case EmotionType.억울:
          score -= intensity / 10;
          break;

        // 강한 부정 감정 → score 감소 크게
        case EmotionType.분노:
        case EmotionType.짜증:
        case EmotionType.속상:
        case EmotionType.상처:
        case EmotionType.배신감:
        case EmotionType.경멸:
        case EmotionType.불쾌:
          score -= intensity / 6;
          break;

        default:
          // affection에 영향을 주지 않는 감정은 무시
          break;
      }
    }

    return score;
  }


  /**
   * 감정에 따라 심적거리를 계산하는 함수
   * 해당 감정에 나타난 강도를 나누어 더하는 식으로 계산함
   */
  async calculateAffection(emotions: EmotionInteraction) {
    let affection = 0;

    const combinedEmotions = this.util.toCombinedEmotionTyped(emotions);

    for (const emotion of combinedEmotions) {
      const emotionType = emotion.emotion;
      const intensity = emotion.intensity;

      switch (emotionType) {
        // 긍정적 affection
        case EmotionType.사랑:
        case EmotionType.유대:
        case EmotionType.친밀:
        case EmotionType.애정:
        case EmotionType.존경:
          affection += intensity / 3;
          break;

        case EmotionType.신뢰:
        case EmotionType.공감:
        case EmotionType.감사:
          affection += intensity / 4;
          break;

        // 중립적 또는 애매한 영향
        case EmotionType.거부감:
        case EmotionType.시기:
        case EmotionType.질투:
        case EmotionType.실망:
        case EmotionType.억울:
          affection -= intensity / 5;
          break;

        // 강한 부정 감정 → affection 감소 크게
        case EmotionType.분노:
        case EmotionType.짜증:
        case EmotionType.속상:
        case EmotionType.상처:
        case EmotionType.배신감:
        case EmotionType.경멸:
        case EmotionType.불쾌:
          affection -= intensity / 3;
          break;

        default:
          // affection에 영향을 주지 않는 감정은 무시
          break;
      }
    }

    return affection;
  }

  async getTargetByDiary(diary: Diary) {
    const diaryTargets = await this.diaryTargetRepository.find({
      where: { diary: { id: diary.id } },
      relations: ['target']
    })

    const targets = diaryTargets.map(target => target.target)
    return targets
  }
}
