import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Diary } from './Diary.entity';
import { ActivityEmotion } from './activity-emotion.entity';
import { ActivityCluster } from './activity-cluster.entity';
import { DiaryEmotion } from './diary-emotion.entity';
import { LocalDate } from 'js-joda';
import { LocalDateTransformer } from '../util/local-date.transformer';

@Entity()
export class Activity {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string;

  @Column('simple-json')
  vector: number[];

  @Column({ type: 'date', transformer: new LocalDateTransformer() })
  date: LocalDate

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

  @OneToMany(() => ActivityEmotion, (emotion) => emotion.activity)
  emotions: ActivityEmotion[];

}