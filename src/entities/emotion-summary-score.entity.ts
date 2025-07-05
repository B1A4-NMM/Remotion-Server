import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MemberSummary } from './member-summary.entity';
import { EmotionGroup } from '../enums/emotion-type.enum';

@Entity()
export class EmotionSummaryScore {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MemberSummary, (summary) => summary.emotionScores, {onDelete: 'CASCADE'})
  summary: MemberSummary;

  @Column({
    type: 'enum',
    enum: EmotionGroup,
  })
  emotion: EmotionGroup; // enum: '활력' | '안정' | ...

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  count: number;
}