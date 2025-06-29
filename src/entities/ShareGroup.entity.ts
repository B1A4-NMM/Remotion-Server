import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Diary } from './Diary.entity';
import { Member } from './Member.entity';
import { UserShareGroup } from './user-share-group.entity';


@Entity()
export class ShareGroup {
    
    @PrimaryGeneratedColumn()
    id! : number;


    @Column()
    name! : string;
    
    // 1:N => 그룹에는 여러 개의 일기
    @OneToMany(() => Diary, (diary) => diary.shareGroup)
    diaries! : Diary[];

    @OneToMany(() => UserShareGroup, (usg) => usg.group)
    userShareGroups! : UserShareGroup[];


}