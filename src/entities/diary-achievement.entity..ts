import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DiaryAchievementCluster } from './diary-achievement-cluster.entity';
import { Diary } from './Diary.entity';

@Entity()
export class DiaryAchievement {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column('simple-json')
  vector: number[];

  @ManyToOne(() => DiaryAchievementCluster,
    (cluster) => cluster.achievements,
    { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cluster_id' })
  cluster: DiaryAchievementCluster;

  @ManyToOne(() => Diary, {onDelete: 'CASCADE'})
  diary: Diary;

}