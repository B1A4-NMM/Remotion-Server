import{
    Entity,
    PrimaryGeneratedColumn,
    Column, 
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
}from 'typeorm'

import { Member } from './Member.entity';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ default: false })
  isCompleted: boolean;
  
  //이 entity가 호출되면 이 시간 기준으로 저장해줌 service에서 따로 처리 필요없음
  @CreateDateColumn()
  createdAt: Date;
  
  //업데이트 시각 자동 저장해줌 , service에서 따로 처리 필요없음
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Member, (member) => member.todos)
  @JoinColumn({ name: 'user_id' })
  owner: Member;
  
}