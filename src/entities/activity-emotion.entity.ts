import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './Activity.entity';
import { EmotionBase, EmotionType } from '../enums/emotion-type.enum';
import { ActivityCluster } from './activity-cluster.entity';

@Entity()
export class ActivityEmotion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ActivityCluster, (activity) => activity.activityEmotions)
  @JoinColumn({ name: 'activity_id' })
  activityCluster: ActivityCluster;

  @Column({
    type: 'enum',
    enum: EmotionType,
    default : EmotionType.무난,
  })
  emotion: EmotionType;

  @Column({
    type: 'enum',
    enum: EmotionBase,
    default : EmotionBase.State,
  })
  emotionBase: EmotionBase;

  @Column()
  intensitySum: number;

  @Column()
  count: number;


}