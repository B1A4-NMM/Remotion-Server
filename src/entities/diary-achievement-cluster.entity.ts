import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './Member.entity';
import { DiaryAchievement } from './diary-achievement';

@Entity()
export class DiaryAchievementCluster {

  @PrimaryColumn()
  id: string

  @ManyToOne(() => Member, )
  author:Member

  @Column()
  label:string

  @Column('simple-json')
  centroid: number[]

  @OneToMany(() => DiaryAchievement, (achievement) => achievement.cluster)
  achievements: DiaryAchievement[]

}