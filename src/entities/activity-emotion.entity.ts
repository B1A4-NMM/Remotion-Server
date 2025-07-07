import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './Activity.entity';
import { EmotionBase, EmotionGroup, EmotionType } from '../enums/emotion-type.enum';
import { ActivityCluster } from './activity-cluster.entity';

@Entity()
export class ActivityEmotion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Activity, (activity) => activity.emotions, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({
    type: 'enum',
    enum: EmotionType,
    default : EmotionType.무난,
  })
  emotion: EmotionType;

  @Column({
    type: 'enum',
    enum: EmotionGroup,
    default : EmotionGroup.안정,
  })
  emotionBase: EmotionGroup;

  @Column()
  intensitySum: number;

  @Column()
  count: number;


}