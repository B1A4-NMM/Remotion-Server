import { ApiProperty } from '@nestjs/swagger';
import { EmotionType } from '../../enums/emotion-type.enum';

export class EmotionBaseAnalysisDto {
  @ApiProperty({ enum: EmotionType })
  emotion: EmotionType;

  @ApiProperty({ example: 0.87 })
  intensity: number;

  @ApiProperty({ example: 5 })
  count: number;
}



/* 
-result.Relation
-result.Self 
-result.State 

각각 EmotionBaseAnalysisDto 배열

EmotionBaseAnalysisDto[]; 
이 타입의 객체들을 담는 배열 ! 

*/
export class EmotionBaseAnalysisResponseDto {
  @ApiProperty({ type: [EmotionBaseAnalysisDto] })
  Relation: EmotionBaseAnalysisDto[];

  @ApiProperty({ type: [EmotionBaseAnalysisDto] })
  Self: EmotionBaseAnalysisDto[];

  @ApiProperty({ type: [EmotionBaseAnalysisDto] })
  State: EmotionBaseAnalysisDto[];
}
