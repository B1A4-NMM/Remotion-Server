import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { EmotionType } from '../enums/emotion-type.enum'; // EmotionType 임포트

@Entity()
export class YoutubeApi {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  videoId!: string;

  @Column({ type: 'enum', enum: EmotionType }) // EmotionType enum 사용
  emotion!: EmotionType; // 컬럼 이름 변경

  @Column()
  keyword!: string; // 컬럼 이름 변경
}
