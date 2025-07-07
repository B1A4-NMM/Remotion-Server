import { ApiProperty } from '@nestjs/swagger';
import { EmotionByDateDto } from './emotion-by-date.dto';
import { TodoItemDto } from './todo-item.dto';

export class GetTodosResponseDto {
  @ApiProperty({ type: [EmotionByDateDto] })
  emotions: EmotionByDateDto[];

  @ApiProperty({ type: [TodoItemDto] })
  todos: TodoItemDto[];
}
