import { ApiProperty } from '@nestjs/swagger';
import { RoutineEnum } from '../../enums/routine.enum';

export class RecommendRoutineRes {
  @ApiProperty({ description: '루틴 ID', type: Number, nullable: true })
  routineId?: number | null;

  @ApiProperty({ description: '루틴 타입', enum: RoutineEnum })
  routineType: RoutineEnum;

  @ApiProperty({ description: '루틴 내용', type: String, nullable: true })
  content?: string | null;
}
