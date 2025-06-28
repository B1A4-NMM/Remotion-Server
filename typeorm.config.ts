import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import *as dotenv from 'dotenv';
import { User } from './src/entities/User.entity'; 
import { Diary } from './src/entities/Diary.entity';
import { Emotion } from './src/entities/Emotion.entity';
import { Target } from './src/entities/Target.entity';
import { ShareGroup } from './src/entities/ShareGroup.entity';
import { Alias } from './src/entities/Alias.entity';
import { DiaryTarget } from 'src/entities/diary-target.entity';
import { EmotionTarget } from 'src/entities/emotion-target.entity';
import { UserShareGroup } from 'src/entities/user-share-group.entity';


//__dirname + '/**/*.entity{.ts,.js}'



dotenv.config();
const config:TypeOrmModuleOptions = {
    type:'mysql',
    host:'localhost',
    port:3306,
    username:process.env.DB_USERNAME,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    entities:[
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
    synchronize : true, // 한번 true한 뒤로는 무조건 false
    autoLoadEntities:true,
    charset:'utf8mb4',
    logging:true, 
    //keepConnectionAlive:true,
}

export = config;