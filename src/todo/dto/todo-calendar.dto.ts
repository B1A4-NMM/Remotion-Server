import { ApiProperty } from '@nestjs/swagger';

export class TodoCalendarResDto {
  @ApiProperty({ description: 'Todo 항목의 고유 ID', type: Number })
  id: number;

  @ApiProperty({ description: 'Todo 항목의 완료 여부', type: Boolean })
  isComplete: boolean;

  @ApiProperty({ description: 'Todo 항목의 내용', type: String })
  content: string;

  constructor(id: number, isComplete: boolean, content: string) {
    this.id = id;
    this.isComplete = isComplete;
    this.content = content;
  }
}
