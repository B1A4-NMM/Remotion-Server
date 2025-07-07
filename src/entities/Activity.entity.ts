import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Diary } from './Diary.entity';

@Entity()
export class Activity {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string;

  @ManyToOne(() => Diary, (diary) => diary.activities, {onDelete: 'CASCADE'} )
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @Column({ type: 'varchar' ,nullable: true})
  strength?: string | null

  @Column({ type: 'varchar' ,nullable: true})
  weakness?: string | null


}