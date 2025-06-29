import{
    Entity,
    PrimaryGeneratedColumn,
    Column, 
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
}from 'typeorm'

import { User } from './User.entity';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.todos)
  @JoinColumn({ name: 'user_id' })
  user: User;
  
}