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

  constructor(routine:Routine) {
    this.routineId = routine.id;
    this.content = routine.content;
    this.routineType = routine.routineType;
  }
}
