import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Todo } from './Todo.entity';
import { LocalDate } from 'js-joda';
import { LocalDateTransformer } from '../util/local-date.transformer';
import { Member } from './Member.entity';

@Entity()
export class TodoCalendar {
  @PrimaryGeneratedColumn()
  id:number

  @Column()
  content:string

  @Column({type:'boolean', default: false})
  isCompleted:boolean

  @Column({ type: 'date',  transformer: new LocalDateTransformer() })
  date:LocalDate

  @ManyToOne(() => Member, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'member_id' })
  member:Member

}