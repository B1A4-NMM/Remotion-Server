import { LocalDate } from 'js-joda';
import{
    Entity,
    PrimaryGeneratedColumn,
    Column, 
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    OneToMany,
}from 'typeorm'
import { LocalDateTransformer } from '../util/local-date.transformer';

import { Member } from './Member.entity';

//import { DiaryTodo } from './diary-todo.entity';
//diary-todo와의 관계 필요없음 

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'date', nullable: true, transformer: new LocalDateTransformer() })
  date?: LocalDate | null;

  @Column({ type: 'boolean' ,default: false })
  isRepeat: boolean;

  @Column({ type: 'varchar', nullable: true , default: null })
  repeatRule?: string | null;

  @Column({ type: 'date', nullable: true, transformer: new LocalDateTransformer() })
  repeatEndDate?: LocalDate | null;
  
  //이 entity가 호출되면 이 시간 기준으로 저장해줌 service에서 따로 처리 필요없음
  @Column({ type: 'date',  transformer: new LocalDateTransformer() })
  createdAt: LocalDate;
  
  //업데이트 시각 자동 저장해줌 , service에서 따로 처리 필요없음
  @Column({ type: 'date', transformer: new LocalDateTransformer() })
  updatedAt: LocalDate;

  @ManyToOne(() => Member, (member) => member.todos)
  @JoinColumn({ name: 'user_id' })
  owner: Member;


  // // 💡 DiaryTodo와 양방향 설정
  // @OneToMany(() => DiaryTodo, (diaryTodo) => diaryTodo.todo)
  // diaryTodos: DiaryTodo[];

  
}