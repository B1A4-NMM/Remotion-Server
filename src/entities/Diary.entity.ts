import { LocalDate } from 'js-joda';
import { Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne,
    JoinColumn, 
    OneToMany} from 'typeorm';
import { LocalDateTransformer } from '../util/local-date.transformer';

import { ShareGroup } from './ShareGroup.entity';   
import { Member } from './Member.entity';
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
    
    @Column({ type:'date', transformer: new LocalDateTransformer() })
    create_date! : LocalDate;

    @Column({ type: 'date', transformer: new LocalDateTransformer() })
    written_date! : LocalDate;

    @Column({ type: 'text' })
    content! : string;
    
    //요약한 제목
    @Column()
    title! : string;

    @Column({
        type:'enum',
        enum: Weather,
        default : Weather.NONE,
    })
    weather! : Weather;

    @Column({type: 'simple-json' ,nullable : true })
    photo_path! : string[];

    @Column({ nullable : true })
    audio_path! : string;

    @Column({default: false})
    is_bookmarked! : boolean;

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

    //위도
    @Column({ type:'double' , nullable : true })
    latitude? : number;

    //경도
    @Column({ type:'double' ,nullable : true })
    longitude? : number;

    @Column({type: 'json', nullable: true})
    metadata! : any;

    
}
