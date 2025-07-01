import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './Member.entity';

@Entity()
export class MemberSummary {

  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Member, (member) => member.memberSummaries)
  member!: Member;

  @Column()
  date!: Date;

  @Column()
  vitality: number; // 활력
  @Column()
  calmness: number; // 안정
  @Column()
  bonding: number; // 유대
  @Column()
  stress: number; // 스트레스
  @Column()
  anxiety: number; // 불안
  @Column()
  depression: number; // 우울

}