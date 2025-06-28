// data-source.ts
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './src/entities/User.entity';
import { Diary } from './src/entities/Diary.entity';
import { Emotion } from './src/entities/Emotion.entity';
import { Target } from './src/entities/Target.entity';
import { ShareGroup } from './src/entities/ShareGroup.entity';
import { Alias } from './src/entities/Alias.entity'; // 수정 필요
import { DiaryTarget } from './src/entities/diary-target.entity';
import { EmotionTarget } from './src/entities/emotion-target.entity';
import { UserShareGroup } from './src/entities/user-share-group.entity';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Diary,
    Emotion,
    Target,
    ShareGroup,
    Alias,
    DiaryTarget,
    EmotionTarget,
    UserShareGroup,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  charset: 'utf8mb4',
});
