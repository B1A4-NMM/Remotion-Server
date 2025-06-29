import { Entity,
    Column, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    JoinColumn, 
    } from 'typeorm';
import { Target } from './Target.entity';
import { EmotionType } from '../enums/emotion-type.enum';


@Entity('emotion_target')
export class EmotionTarget {
    @PrimaryGeneratedColumn()
    id! : number;

    @Column({
      type: 'enum',
      enum: EmotionType,
      default : EmotionType.행복,
    })
    emotion! : EmotionType;
  
    @ManyToOne(() => Target, (target) => target.emotionTargets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'target_id' })
    target! : Target;

    @Column({ type : 'float' , default : 0 })
    emotion_intensity : number; 

    @Column({ default: 1 }) // 언급 횟수
    mentions : number ; 
    
  }


