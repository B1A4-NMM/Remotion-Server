import { LocalDate } from 'js-joda';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { LocalDateTransformer } from '../util/local-date.transformer';

import { Member } from './Member.entity';
import { Alias } from './Alias.entity';
import { TargetRelation, TargetType } from '../enums/target.enum';
import { DiaryTarget } from './diary-target.entity';
import { EmotionTarget } from './emotion-target.entity';

@Entity()
export class Target {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 0 })
  count!: number;

  @Column({ type: 'date', nullable: true, transformer: new LocalDateTransformer() })
  recent_date!: LocalDate;

  //User와 어떤 관계인지
  @Column({
    type: 'enum',
    enum: TargetRelation,
    default: TargetRelation.ETC,
  })
  relation!: TargetRelation;

  @Column({
    type: 'enum',
    enum: TargetType,
    default: TargetType.PERSON,
  })
  type!: TargetType;

  //심적거리
  @Column({ type: 'float', default: 0 })
  affection!: number;

  // 1 : N 관계 User와 감정객체
  @ManyToOne(() => Member, (user) => user.Targets)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @OneToMany(() => DiaryTarget, (dt) => dt.target)
  diaryTargets!: DiaryTarget[];

  @OneToMany(() => EmotionTarget, (et) => et.target)
  emotionTargets!: EmotionTarget[];

  @OneToMany(() => Alias, (alias) => alias.Target)
  aliases!: Alias[];

  constructor(
    name: string,
    count: number,
    recent_date: LocalDate,
    relation: TargetRelation,
    affection: number,
    member: Member,
  ) {
    this.name = name;
    this.count = count;
    this.recent_date = recent_date;
    this.relation = relation;
    this.affection = affection;
    this.member = member;
  }
}
