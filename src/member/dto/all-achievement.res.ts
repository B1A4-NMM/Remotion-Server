import { ApiProperty } from '@nestjs/swagger';

export class AchievementRes {
  @ApiProperty({
    description: '성취 클러스터의 ID',
    example: '1234-5678',
  })
  id: string;

  @ApiProperty({
    description: '성취 클러스터의 라벨',
    example: '운동하기',
  })
  label: string;

  @ApiProperty({
    description: '성취 클러스터의 성취 수',
    example: 5,
  })
  count: number;
}

export class AllAchievementRes {
  @ApiProperty({
    description: '성취 클러스터 배열',
    type: [AchievementRes],
  })
  achievements: AchievementRes[] = [];
}
