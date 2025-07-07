import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './Member.entity';
import { DiaryAchievement } from './diary-achievement.entity.';

@Entity()
export class DiaryAchievementCluster {

  @PrimaryColumn()
  id: string

  @ManyToOne(() => Member, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'author_id' })
  author:Member

  @Column()
  clusteredCount:number

  @Column()
  label:string

  @Column('simple-json')
  centroid: number[]

  @OneToMany(() => DiaryAchievement, (achievement) => achievement.cluster)
  achievements: DiaryAchievement[]

}