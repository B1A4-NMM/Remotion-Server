import { Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany} from 'typeorm';
import { EmotionType } from '../enums/emotion-type.enum';
import { Target } from './Target.entity';
import { EmotionTarget } from './emotion-target.entity';


@Entity()
export class Emotion {

    @PrimaryGeneratedColumn()
    id! : number;

    
    @Column({
        type: 'enum',
        enum: EmotionType,
        default : EmotionType.행복,
    })
    name! : EmotionType;


    @OneToMany(() => EmotionTarget, (et) => et.emotion )
    emotionTargets! : EmotionTarget[];


}