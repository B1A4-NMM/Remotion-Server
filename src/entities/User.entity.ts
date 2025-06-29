import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Diary } from './Diary.entity';
import { ShareGroup } from './ShareGroup.entity';
import { Target } from './Target.entity';
import { UserShareGroup } from './user-share-group.entity';
import { Todo } from './Todo.entity';


@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id! : number;

    @Column()
    nickname! : string;

    @Column()
    social_type! : string;

    @Column()
    daily_limit! :number;

    @OneToMany(() => Diary, (diary) => diary.user)
    diaries! : Diary[];
    

    // //ShareGroup 엔티티를 group이라는 변수로 참조한 것
    // @ManyToMany(() => ShareGroup, (group) => group.members)
    // shareGroups : ShareGroup[];

    @OneToMany(() => UserShareGroup, (usg) => usg.user)
    userShareGroups! : UserShareGroup[];


    @OneToMany(() => Target,(target) => target.user)
    Targets! : Target[];

    @OneToMany( () => Todo, (todo) => todo.user)
    todos: Todo[];

}