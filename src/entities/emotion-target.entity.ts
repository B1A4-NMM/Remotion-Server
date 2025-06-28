import { Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    JoinColumn, 
    } from 'typeorm';
import { Emotion } from './Emotion.entity';
import { Target } from './Target.entity';


@Entity('emotion_target')
export class EmotionTarget {
    @PrimaryGeneratedColumn()
    id! : number;
  
    @ManyToOne(() => Emotion, (emotion) => emotion.emotionTargets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'emotion_id' })
    emotion! : Emotion;
  
    @ManyToOne(() => Target, (target) => target.emotionTargets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'target_id' })
    target! : Target;
  }


