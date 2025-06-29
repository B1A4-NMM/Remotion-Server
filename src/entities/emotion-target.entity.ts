import { Entity,
    Column, 
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

    @Column({ type : 'float' , default : 0 })
    emotion_intensity : number; 

    @Column({ default: 1 }) // 언급 횟수
    mentions : number ; 
    
  }


