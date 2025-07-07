import { ApiProperty } from '@nestjs/swagger';

export class TodoItemDto {
  @ApiProperty({ example: '16168c58-4ca0-4a0f-b95c-af7a44cbeefa' })
  id: string;

  @ApiProperty({ example: '집 가기' })
  title: string;

  @ApiProperty({ example: false })
  isCompleted: boolean;

  @ApiProperty({ example: '2025-07-03', nullable: true })
  date: string | null;

  @ApiProperty({ example: true })
  isRepeat: boolean;

  @ApiProperty({ example: null, nullable: true })
  repeatRule: string | null;

  @ApiProperty({ example: null, nullable: true })
  repeatEndDate: string | null;

  @ApiProperty({ example: '2025-07-01T12:45:30.394Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-07-05T07:33:28.000Z' })
  updatedAt: string;
}
