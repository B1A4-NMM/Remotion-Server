import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { EmotionType } from '../enums/emotion-type.enum'; // EmotionType 임포트

@Entity()
@Index(['emotionType', 'searchKeyword']) // 인덱스 업데이트
export class YoutubeApi {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  videoId!: string;

  @Column({ type: 'enum', enum: EmotionType }) // EmotionType enum 사용
  emotionType!: EmotionType; // 컬럼 이름 변경

  @Column()
  searchKeyword!: string; // 컬럼 이름 변경

  @CreateDateColumn()
  createdAt!: Date;
}
