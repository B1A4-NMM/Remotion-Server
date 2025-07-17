
import { ApiProperty } from '@nestjs/swagger';

export class WrittenDaysDto {
  @ApiProperty({
    example: [1, 3, 5, 10, 14, 22],
    description: '일기가 작성된 날짜(day) 배열',
  })
  writtenDays: number[];
}
