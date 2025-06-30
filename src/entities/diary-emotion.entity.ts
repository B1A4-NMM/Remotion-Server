import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { EmotionType } from '../enums/emotion-type.enum';

@Entity()
export class DiaryEmotion {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Diary, (diary) => diary.diaryEmotions, {onDelete: 'CASCADE'})
  diary!: Diary;

  @Column({
    type: 'enum',
    enum: EmotionType,
    default : EmotionType.무난,
  })
  emotion! : EmotionType;

  @Column()
  intensity! : number;

  constructor(diary: Diary, emotion: EmotionType, intensity: number) {
    this.diary = diary;
    this.emotion = emotion;
    this.intensity = intensity;
  }
}