import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { Member } from './src/entities/Member.entity';
import { Diary } from './src/entities/Diary.entity';
import { Target } from './src/entities/Target.entity';
import { ShareGroup } from './src/entities/ShareGroup.entity';
import { Alias } from './src/entities/Alias.entity';
import { DiaryTarget } from 'src/entities/diary-target.entity';
import { EmotionTarget } from 'src/entities/emotion-target.entity';
import { UserShareGroup } from 'src/entities/user-share-group.entity';
import * as process from 'node:process';
import { Todo } from './src/entities/Todo.entity';
import { Activity } from './src/entities/Activity.entity';
import { MemberSummary } from './src/entities/member-summary.entity';
import { EmotionSummaryScore } from './src/entities/emotion-summary-score.entity';

//__dirname + '/**/*.entity{.ts,.js}'

dotenv.config();
// @ts-ignore
const config: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Member,
    Diary,
    Target,
    ShareGroup,
    Alias,
    DiaryTarget,
    EmotionTarget,
    UserShareGroup,
    Todo,
    Activity,
    MemberSummary,
    EmotionSummaryScore,
  ],
  synchronize: true, // 한번 true한 뒤로는 무조건 false
  autoLoadEntities: true,
  charset: 'utf8mb4',
  // logging:true,
  //keepConnectionAlive:true,
};

export = config;
