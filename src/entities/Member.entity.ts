import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, PrimaryColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { ShareGroup } from './ShareGroup.entity';
import { Target } from './Target.entity';
import { UserShareGroup } from './user-share-group.entity';
import { Todo } from './Todo.entity';
import { SocialType } from '../enums/social-type.enum';
import { MemberSummary } from './member-summary.entity';
import { scheduled } from 'rxjs';

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


}