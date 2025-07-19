import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './Activity.entity';
import { Target } from './Target.entity';

@Entity()
export class ActivityTarget {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Activity, {onDelete: 'CASCADE'})
  activity: Activity;

  @ManyToOne(() => Target, {onDelete: 'CASCADE'})
  target: Target;

}