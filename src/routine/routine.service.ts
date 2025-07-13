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
  ) {
  }

  async getRoutine(memberId: string, routineType:RoutineEnum) {
    const result = await this.routineRepository.find({
      where: {
        member: {id : memberId},
        routineType: routineType,
        isTrigger: false
      }
    })

    const res: any[] = []
    res.push(result.map(r => new RoutineRes(r)))
    return res
  }
  
  async createRoutine(memberId: string, routineType:RoutineEnum, content: string) {
    const routine = new Routine();
    routine.member = await this.memberService.findOne(memberId)
    routine.routineType = routineType
    routine.isTrigger = false
    routine.content = content
    await this.routineRepository.save(routine)
    return routine
  }

}
