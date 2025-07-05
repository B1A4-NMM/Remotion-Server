import { ApiProperty } from '@nestjs/swagger';

export class CreateDiaryRes {
  @ApiProperty({description: '생성된 일기 id'})
  id: number;

  constructor(id: number) {
    this.id = id;
  }
}