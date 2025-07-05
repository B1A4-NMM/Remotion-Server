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

import { Member } from './Member.entity';

//import { DiaryTodo } from './diary-todo.entity';
//diary-todo와의 관계 필요없음 

@Entity()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column({ default: false })
  isRepeat: boolean;

  @Column({ nullable: true })
  repeatRule: string;

  @Column({ type: 'date', nullable: true })
  repeatEndDate: string;
  
  //이 entity가 호출되면 이 시간 기준으로 저장해줌 service에서 따로 처리 필요없음
  @CreateDateColumn()
  createdAt: Date;
  
  //업데이트 시각 자동 저장해줌 , service에서 따로 처리 필요없음
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Member, (member) => member.todos)
  @JoinColumn({ name: 'user_id' })
  owner: Member;
  // // 💡 DiaryTodo와 양방향 설정
  // @OneToMany(() => DiaryTodo, (diaryTodo) => diaryTodo.todo)
  // diaryTodos: DiaryTodo[];

  
}