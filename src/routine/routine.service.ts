import { Injectable } from '@nestjs/common';
import { Routine } from '../entities/rotine.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutineEnum } from '../enums/routine.enum';
import { RoutineRes } from './dto/routine.res';
import { MemberService } from '../member/member.service';
import { EmotionGroup } from '../enums/emotion-type.enum';
import { EmotionService } from 'src/emotion/emotion.service';
import { RecommendRoutineRes } from './dto/recommend-routine.res';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
    private readonly memberService: MemberService,
    private readonly emotionService: EmotionService,
  ) {}

  /**
   * 루틴 종류를 하나 선택해서 해당 멤버의 모든 루틴을 가져옵니다
   */
  async getRoutine(memberId: string, routineType: RoutineEnum) {
    const result = await this.routineRepository.find({
      where: {
        member: { id: memberId },
        routineType: routineType,
        isTrigger: false,
      },
    });

    const res: RoutineRes[] = result.map((r) => new RoutineRes(r));
    return res;
  }

  /**
   * 루틴을 하나 생성합니다
   */
  async createRoutine(
    memberId: string,
    routineType: RoutineEnum,
    content: string,
  ) {
    const routine = new Routine();
    routine.member = await this.memberService.findOne(memberId);
    routine.routineType = routineType;
    routine.isTrigger = false;
    routine.content = content;
    await this.routineRepository.save(routine);
    return routine;
  }

  /**
   * 해당 멤버의 트리거를 모두 가져옵니다
   */
  async getTrigger(memberId: string) {
    const result = await this.routineRepository.find({
      where: {
        member: { id: memberId },
        isTrigger: true,
      },
    });

    return result.map((r) => new RoutineRes(r));
  }

  /**
   * 트리거를 토글하여 폴더에서 추가하거나, 삭제합니다
   */
  async toggleTrigger(id: number) {
    const trigger = await this.routineRepository.findOneOrFail({
      where: {
        id: id,
      },
    });
    trigger.isTrigger = !trigger.isTrigger;
    return await this.routineRepository.save(trigger);
  }

  async getRecommendRoutine(memberId: string, diaryId: number) {
    const emotion = await this.emotionService.getRepresentEmotionGroup(diaryId)
    let res = new RecommendRoutineRes();
    if (!emotion) {
      res.routineId = null
      res.content = null
      return res
    }
    const routine = await this.getRecommendRoutineRandom(memberId, emotion)
    if (!routine) {
      res.routineId = null
      res.content = null
      return res
    }

    res.routineId = routine.routineId
    res.content = routine.content
    return res
  }

  /**
   * 인자로 받은 감정 그룹에 알맞은 루틴 하나를 랜덤으로 추천합니다
   */
  async getRecommendRoutineRandom(memberId: string, emotions: EmotionGroup) {
    let routine: RoutineRes[] = [];
    switch (emotions) {
      case EmotionGroup.스트레스:
        routine = await this.getRoutine(memberId, RoutineEnum.STRESS);
        break;
      case EmotionGroup.불안:
        routine = await this.getRoutine(memberId, RoutineEnum.ANXIETY);
        break;
      case EmotionGroup.우울:
        routine = await this.getRoutine(memberId, RoutineEnum.DEPRESSION);
        break;
      default:
        return null;
    }

    if (routine.length === 0) {
      return null;
    }
    return routine[Math.floor(Math.random() * routine.length)];
  }
}
