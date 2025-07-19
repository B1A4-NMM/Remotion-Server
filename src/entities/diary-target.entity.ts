import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Diary } from './Diary.entity';
import { Target } from './Target.entity';

@Entity('diary_target')
export class DiaryTarget {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Diary, (diary) => diary.diaryTargets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'diary_id' })
  diary!: Diary;

  @ManyToOne(() => Target, (target) => target.diaryTargets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target!: Target;
  
  @Column({ type: 'int', default: 0 })
  changeScore:number


  constructor(diary: Diary, target: Target) {
    this.diary = diary;
    this.target = target;
  }
}
