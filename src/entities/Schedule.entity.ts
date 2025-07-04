import{
    Entity,
    PrimaryGeneratedColumn,
    Column, 
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
}from 'typeorm'

import { Todo } from './Todo.entity';
import { Member } from './Member.entity';

@Entity()
export class Schedule {
    @PrimaryGeneratedColumn()
    id : number;

    @Column()
    title : string

    @Column({ type: 'datetime' })
    startAt: Date;

    @Column({ type: 'datetime' })
    endAt: Date;

    @Column({ default: false })
    isAllDay: boolean;

    @Column({ default: false })
    isRepeat: boolean;

    @Column({ nullable: true })
    repeatRule: string; // 예: 'DAILY', 'WEEKLY', 'MONTHLY'

    @ManyToOne(() => Todo, (todo) => todo.schedules, { nullable : true, onDelete: 'SET NULL' })
    @JoinColumn({ name : 'todoId' })
    todo?: Todo;

    @ManyToOne(() => Member, (member) => member.schedules)
    @JoinColumn({ name : 'member_id'})
    user: Member;

}