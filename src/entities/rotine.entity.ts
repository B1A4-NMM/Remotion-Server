import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RoutineEnum } from '../enums/routine.enum';
import { Member } from './Member.entity';

@Entity()
export class Routine {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: RoutineEnum
  })
  routineType: RoutineEnum

  @Column()
  content: string;

  @Column()
  isTrigger: boolean;

  @ManyToOne(() => Member, (member) => member.routines)
  member: Member;

}