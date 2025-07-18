import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { Member } from './Member.entity';
import { LocalDate } from 'js-joda';
import { LocalDateTransformer } from '../util/local-date.transformer';

@Entity()
export class NotificationEntity {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  content: string

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType

  @Column({type: 'varchar', nullable: true, default: null})
  photoPath?:string | null

  @Column({ type:'date', transformer: new LocalDateTransformer() })
  createDate:LocalDate

  @Column({default: false})
  isRead: boolean

  @Column({default: null})
  diaryId?: number

  @ManyToOne(() => Member, (member) => member.notifications, {onDelete: 'CASCADE'})
  @JoinColumn({name:'author_id'})
  author: Member

}