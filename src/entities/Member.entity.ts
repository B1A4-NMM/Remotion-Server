import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, PrimaryColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { ShareGroup } from './ShareGroup.entity';
import { Target } from './Target.entity';
import { UserShareGroup } from './user-share-group.entity';
import { Todo } from './Todo.entity';
import { SocialType } from '../enums/social-type.enum';
import { MemberSummary } from './member-summary.entity';
import { scheduled } from 'rxjs';
import { Routine } from './rotine.entity';
import { LocalDateTransformer } from '../util/local-date.transformer';
import { LocalDate } from 'js-joda';
import { PushSubscription } from './push-subscription.entity';
import { NotificationEntity } from './notification.entity';

@Entity()
export class Member {

    @PrimaryColumn()
    id! : string;

    @Column()
    email! : string;

    @Column()
    nickname! : string;

    @Column({
      type : 'enum',
      enum: SocialType
    })
    social_type! : string;

    @Column()
    daily_limit! :number;

    @Column({default: 'unknown'})
    character:string

    @OneToMany(() => Diary, (diary) => diary.author)
    diaries! : Diary[];
    

    // //ShareGroup 엔티티를 group이라는 변수로 참조한 것
    // @ManyToMany(() => ShareGroup, (group) => group.members)
    // shareGroups : ShareGroup[];

    @OneToMany(() => UserShareGroup, (usg) => usg.user)
    userShareGroups! : UserShareGroup[];


    @OneToMany(() => Target,(target) => target.member)
    Targets! : Target[];

    @OneToMany( () => Todo, (todo) => todo.owner)
    todos: Todo[];

    @OneToMany(() => MemberSummary, (summary) => summary.member)
    memberSummaries!: MemberSummary[];

    @OneToMany(() => Routine, (routine) => routine.member)
    routines!: Routine[];

    @OneToMany(() => PushSubscription, (p) => p.author)
    pushSubscriptions!: PushSubscription[];

    @OneToMany(() => NotificationEntity, (n) => n.author)
    notifications!: NotificationEntity[];

    @Column({ type:'date', transformer: new LocalDateTransformer(), nullable: true })
    stress_test_date? : LocalDate;

    @Column({ type:'date', transformer: new LocalDateTransformer(), nullable: true })
    anxiety_test_date? : LocalDate;

    @Column({ type:'date', transformer: new LocalDateTransformer(), nullable: true })
    depression_test_date? : LocalDate;


}