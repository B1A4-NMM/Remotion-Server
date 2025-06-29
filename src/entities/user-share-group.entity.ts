import { Entity, 
    PrimaryGeneratedColumn, 
    ManyToOne,
    JoinColumn } from 'typeorm';
import { Member } from './Member.entity';
import { ShareGroup } from './ShareGroup.entity';




@Entity('user_share_group')
export class UserShareGroup {

  @PrimaryGeneratedColumn()
  id! : number;

  @ManyToOne(() => Member, (user) => user.userShareGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user! : Member;

  @ManyToOne(() => ShareGroup, (group) => group.userShareGroups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group! : ShareGroup;


}