import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { Member } from './Member.entity';

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

  @Column({nullable: true})
  photoPath?:string

  @ManyToOne(() => Member, (member) => member.notifications, {onDelete: 'CASCADE'})
  @JoinColumn({name:'author_id'})
  author: Member

}