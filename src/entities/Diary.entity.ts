import { Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    ManyToOne, 
    JoinColumn, 
    OneToMany} from 'typeorm';

import { ShareGroup } from './ShareGroup.entity';   
import { Member } from './Member.entity';
import { Target } from './Target.entity';
import { Weather } from '../enums/weather.enum';
import { DiaryTarget } from './diary-target.entity';
import { Activity } from './Activity.entity';
import { DiaryEmotion } from './diary-emotion.entity';
import { DiaryTodo } from './diary-todo.entity';



@Entity()
export class Diary {
    @PrimaryGeneratedColumn()
    id! : number;

    /*
    ==============================
    이 부분이 DB에서 실제 외래 키를
    생성 한다. 
    ==============================
    */
    @ManyToOne(() => Member, (user)=>user.diaries,{eager :true})
    @JoinColumn({ name : 'author_id' })
    author! : Member;
    
    //실제 생성시간(자동)
    @CreateDateColumn()
    create_date! : Date;

    @Column({ type: 'date' })
    written_date! : Date;

    @Column({ type: 'text' })
    content! : string;
    
    //요약한 제목
    @Column()
    title! : string;

    @Column({
        type:'enum',
        enum: Weather,
        default : Weather.SUNNY,
    })
    weather! : Weather;

    @Column({ nullable : true })
    photo_path! : string;

    // 추후 extra로 사용할듯
    @ManyToOne(() => ShareGroup,(group) => group.diaries, { nullable : true })
    @JoinColumn({ name: 'group_id' })
    shareGroup! : ShareGroup;

    @OneToMany(() => DiaryTarget, (dt) => dt.diary)
    diaryTargets! : DiaryTarget[];

    @OneToMany(() => Activity, (activity) => activity.diary)
    activities! : Activity[];

    @OneToMany(() => DiaryEmotion, (emotion) => emotion.diary)
    diaryEmotions! : DiaryEmotion[];

    // 💡 DiaryTodo와 양방향 설정
    @OneToMany(() => DiaryTodo, (diaryTodo) => diaryTodo.diary, { cascade: true })
    diaryTodos: DiaryTodo[];


    
}
