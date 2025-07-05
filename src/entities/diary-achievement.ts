import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DiaryAchievementCluster } from './diary-achievement-cluster.entity';

@Entity()
export class DiaryAchievement {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string

  @Column('simple-json')
  vector: number[]

  @ManyToOne(() => DiaryAchievementCluster,
    (cluster) => cluster.achievements,
    { onDelete: 'CASCADE' })
  cluster: DiaryAchievementCluster;

}