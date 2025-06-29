import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Diary } from './Diary.entity';

@Entity()
export class Activity {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string;

  @ManyToOne(() => Diary, (diary) => diary.activities)
  diary: Diary;

}