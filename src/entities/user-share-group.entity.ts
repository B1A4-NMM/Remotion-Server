import { Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { ShareGroup } from './ShareGroup.entity';




@Entity('user_share_group')
export class UserShareGroup {

  @PrimaryGeneratedColumn()
  id! : number;

  @ManyToOne(() => User, (user) => user.userShareGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user! : User;

  @ManyToOne(() => ShareGroup, (group) => group.userShareGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group! : ShareGroup;


}