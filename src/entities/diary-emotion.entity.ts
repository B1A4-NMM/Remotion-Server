import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { EmotionBase, EmotionType } from '../enums/emotion-type.enum';
import { Activity } from './Activity.entity';

@Entity()
export class DiaryEmotion {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Diary, (diary) => diary.diaryEmotions, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'diary_id' })
  diary!: Diary;

  @ManyToOne(() => Activity, (activity) => activity.emotions)
  @JoinColumn({ name: 'activity_id' })
  activity!: Activity;

  @Column({
    type: 'enum',
    enum: EmotionType,
    default : EmotionType.무난,
  })
  emotion! : EmotionType;


  @Column({
    type: 'enum',
    enum: EmotionBase,
    default : EmotionBase.Self,
  })
  emotionBase! : EmotionBase;


  @Column({ type: 'float'})
  intensity! : number;

  constructor(diary: Diary, emotion: EmotionType, emotionBase: EmotionBase, intensity: number) {
    this.diary = diary;
    this.emotion = emotion;
    this.emotionBase = emotionBase;
    this.intensity = intensity;
  }
}