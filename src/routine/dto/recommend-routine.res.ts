import { ApiProperty } from '@nestjs/swagger';

export class RecommendRoutineRes {
  @ApiProperty({ description: '루틴 ID', type: Number, nullable: true })
  routineId?: number | null;

  @ApiProperty({ description: '루틴 내용', type: String, nullable: true })
  content?: string | null;
}
