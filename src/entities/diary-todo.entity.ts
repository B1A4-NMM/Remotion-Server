import { LocalDate } from 'js-joda';
import { Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    JoinColumn,
    Column, 
    CreateDateColumn} from 'typeorm';
import { LocalDateTransformer } from '../util/local-date.transformer';

import { Todo } from './Todo.entity';
import { Diary } from './Diary.entity';
import { Member } from './Member.entity';


/*
====================================================
-이 테이블은 원본 분석 결과를 보관하는 곳
-수정/삭제 없이 유지된다.
====================================================
*/
@Entity()
export class DiaryTodo {
    @PrimaryGeneratedColumn()
    id : number; 

    @Column()
    content: string; // 분석된 할 일 텍스트

    @ManyToOne(() => Diary, (diary) => diary.diaryTodos, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'diary_id' })
    diary: Diary;
  
    @ManyToOne(() => Member)
    @JoinColumn({ name: 'user_id' })
    member: Member;

    // @ManyToOne(() => Todo, (todo) => todo.diaryTodos, { nullable: true })
    // @JoinColumn({ name: 'todo_id' })
    // todo: Todo;

    @Column({type:'date', transformer: new LocalDateTransformer() })
    createdAt : LocalDate;


}


