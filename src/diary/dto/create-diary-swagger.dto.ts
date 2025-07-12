import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDiaryDto } from './create-diary.dto';

export class CreateDiaryWithMediaDto extends CreateDiaryDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  photo?: any;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' } })
  audios?: any[];
}