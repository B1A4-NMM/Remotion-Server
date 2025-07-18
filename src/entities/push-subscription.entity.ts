import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne } from 'typeorm';
import { Member } from './Member.entity';
import { PushSubscriptionInterface } from '../webpush/webpush.controller';

@Entity('push_subscription')
export class PushSubscription {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({default: null})
  endpoint!: string;

  @Column()
  p256dh!: string;

  @Column()
  auth!: string;

  @ManyToOne(() => Member, (member) => member.pushSubscriptions, {onDelete: 'CASCADE'})
  author: Member;

  @Column({type: 'boolean', default: false})
  isSubscribed: boolean;

  constructor() {
    // TypeORM will create instances using this constructor.
    // Properties will be assigned by TypeORM after creation.
  }

  static fromInterface(push: PushSubscriptionInterface, member: Member): PushSubscription {
    const newPush = new PushSubscription();
    newPush.endpoint = push.endpoint;
    newPush.p256dh = push.keys.p256dh;
    newPush.auth = push.keys.auth;
    newPush.author = member;
    newPush.isSubscribed = false; // Default value
    return newPush;
  }
}

