import { LocalDate } from 'js-joda';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './Member.entity';
import { EmotionSummaryScore } from './emotion-summary-score.entity';
import { LocalDateTransformer } from '../util/local-date.transformer';

@Entity()
export class MemberSummary {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Member, (member) => member.memberSummaries)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({type: 'date', transformer: new LocalDateTransformer() })
  date!: LocalDate;

  @OneToMany(() => EmotionSummaryScore, (score) => score.summary, { cascade: true })
  emotionScores: EmotionSummaryScore[];

}