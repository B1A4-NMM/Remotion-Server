import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { ActivityEmotion } from './activity-emotion.entity';
import { ActivityCluster } from './activity-cluster.entity';
import { DiaryEmotion } from './diary-emotion.entity';

@Entity()
export class Activity {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string;

  @ManyToOne(() => Diary, (diary) => diary.activities, {onDelete: 'CASCADE'} )
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @Column({ type: 'varchar' ,nullable: true})
  strength?: string | null

  @Column({ type: 'varchar' ,nullable: true})
  weakness?: string | null

  @ManyToOne(() => ActivityCluster, (cluster) => cluster.activities, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'cluster_id' })
  cluster: ActivityCluster;

  @OneToMany(() => DiaryEmotion, (emotion) => emotion.activity)
  emotions: DiaryEmotion[];

}