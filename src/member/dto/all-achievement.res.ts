export class AchievementRes {
  id: string;
  label: string;
  count: number;
}

export class AllAchievementRes {
  achievements: AchievementRes[] = [];
}