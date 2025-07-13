import { RoutineEnum } from '../../enums/routine.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Routine } from '../../entities/rotine.entity';

export class RoutineRes {
  @ApiProperty({ description: '루틴 ID', example: 1 })
  routineId: number;

  @ApiProperty({ description: '루틴 내용', example: '호흡하기' })
  content: string;

  @ApiProperty({
    description: '루틴 타입',
    enum: RoutineEnum,
    example: RoutineEnum.STRESS,
  })
  routineType: RoutineEnum;

  @ApiProperty({
    description:'현재 루틴 폴더에 추가되어있지 않고 트리거로만 저장되어 있는지의 여부',
    example: true
  })
  isTrigger: boolean

  constructor(routine:Routine) {
    this.routineId = routine.id;
    this.content = routine.content;
    this.routineType = routine.routineType;
    this.isTrigger = routine.isTrigger
  }
}
