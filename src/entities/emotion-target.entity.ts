import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Target } from './Target.entity';
import { EmotionType } from '../enums/emotion-type.enum';
import { count } from 'rxjs';
import { LocalDateTransformer } from '../util/local-date.transformer';
import { LocalDate } from 'js-joda';

@Entity('emotion_target')
export class EmotionTarget {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: EmotionType,
    default: EmotionType.행복,
  })
  emotion!: EmotionType;

  @ManyToOne(() => Target, (target) => target.emotionTargets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'target_id' })
  target!: Target;

  @Column({ type: 'float', default: 0 })
  emotion_intensity: number;

  @Column({ default: 1 }) // 감정을 느낀 횟수
  count: number;

  @Column({ type: 'date', transformer: new LocalDateTransformer() })
  feel_date? : LocalDate;

  constructor(
    emotion: EmotionType,
    target: Target,
    emotion_intensity: number,
    count: number,
    feelDate: LocalDate,
  ) {
    this.emotion = emotion;
    this.target = target;
    this.emotion_intensity = emotion_intensity;
    this.count = count;
    this.feel_date = feelDate;
  }
}
