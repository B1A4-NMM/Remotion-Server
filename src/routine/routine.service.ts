import { Injectable } from '@nestjs/common';
import { Routine } from '../entities/rotine.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutineEnum } from '../enums/routine.enum';
import { RoutineRes } from './dto/routine.res';
import { Member } from '../entities/Member.entity';
import { MemberService } from '../member/member.service';

@Injectable()
export class RoutineService {
  constructor(
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
    private readonly memberService: MemberService,
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

    const res: any[] = [];
    res.push(result.map((r) => new RoutineRes(r)));
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
        id : id
      }
    })
    trigger.isTrigger = !trigger.isTrigger
    return await this.routineRepository.save(trigger)
  }
}
