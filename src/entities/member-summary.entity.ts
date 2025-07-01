import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './Member.entity';
import { EmotionSummaryScore } from './emotion-summary-score.entity';

@Entity()
export class MemberSummary {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Member, (member) => member.memberSummaries)
  member!: Member;

  @Column({type: 'date'})
  date!: Date;

  @OneToMany(() => EmotionSummaryScore, (score) => score.summary, { cascade: true })
  emotionScores: EmotionSummaryScore[];

}