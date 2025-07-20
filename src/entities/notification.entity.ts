import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { Member } from './Member.entity';
import { LocalDate, LocalDateTime } from 'js-joda'; // LocalDateTime 임포트 확인
import { LocalDateTransformer } from '../util/local-date.transformer';
import { LocalDateTimeTransformer } from '../util/local-date-time.transformer'; // 새로 만든 트랜스포머 임포트

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

  // 변경된 부분: type을 'timestamp'로, transformer를 LocalDateTimeTransformer로
  @Column({ type:'varchar', transformer: new LocalDateTimeTransformer() })
  createDate:LocalDateTime

  @Column({default: false})
  isRead: boolean

  @Column({type: 'int', default: null})
  diaryId?: number | null

  @Column({type:'date', transformer: new LocalDateTransformer() ,default: null})
  targetDate?: LocalDate | null

  @ManyToOne(() => Member, (member) => member.notifications, {onDelete: 'CASCADE'})
  @JoinColumn({name:'author_id'})
  author: Member

}