import { Todo } from '../../entities/Todo.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TodoRes {
  @ApiProperty({
    description: '할 일 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '할 일 제목',
    example: '운동하기',
  })
  title: string;

  constructor(todo: Todo) {
    this.id = todo.id;
    this.title = todo.title;
  }
}
