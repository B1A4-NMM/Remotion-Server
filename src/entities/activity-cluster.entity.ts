import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Member } from './Member.entity';
import { ActivityEmotion } from './activity-emotion.entity';
import { Activity } from './Activity.entity';

@Entity()
export class ActivityCluster {

  @PrimaryColumn()
  id: number

  @ManyToOne(() => Member, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'author_id' })
  author:Member

  @Column()
  clusteredCount:number

  @Column()
  label:string

  @Column('simple-json')
  centroid: number[]

  @OneToMany(() => ActivityEmotion, (emotion) => emotion.activityCluster)
  activityEmotions: ActivityEmotion[]

  @OneToMany(() => Activity, (activity) => activity.cluster)
  activities: Activity[]

}