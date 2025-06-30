import { Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    JoinColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { Target } from './Target.entity';

@Entity('diary_emotion_target')
export class DiaryTarget {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Diary, (diary) => diary.diaryTargets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'diary_id' })
  diary!: Diary;

  @ManyToOne(() => Target, (target) => target.diaryTargets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target!: Target;


  constructor(diary: Diary, target: Target) {
    this.diary = diary;
    this.target = target;
  }
}
