import { ApiProperty } from '@nestjs/swagger';
import { LocalDate } from 'js-joda';

export class TodoCalendarByMonthRes {
  @ApiProperty({ description: '날짜', type: String, example: '2024-07-18' })
  date: LocalDate;

  @ApiProperty({ description: '해당 날짜의 총 Todo 개수', type: Number })
  todoTotalCount: number;

  @ApiProperty({ description: '완료된 Todo 개수', type: Number })
  completedCount: number;

  @ApiProperty({ description: '모든 Todo가 완료되었는지 여부', type: Boolean })
  isAllCompleted: boolean;

  constructor(
    date: LocalDate,
    todoTotalCount: number,
    completedCount: number,
    isAllCompleted: boolean,
  ) {
    this.date = date;
    this.todoTotalCount = todoTotalCount;
    this.completedCount = completedCount;
    this.isAllCompleted = isAllCompleted;
  }
}
