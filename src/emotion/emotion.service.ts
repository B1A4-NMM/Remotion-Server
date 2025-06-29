import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';
import { isEmotionType } from '../enums/emotion-type.enum';

@Injectable()
export class EmotionService {
  constructor(
    @InjectRepository(EmotionTarget) private readonly emotionTargetRepository: Repository<EmotionTarget>,
  ) {}

  createByTarget(target: Target, dto:any) {



  }

  findOne(target: Target, emotion: string) {
    if (!isEmotionType(emotion)) {
      throw new Error('emotion type is not valid')
    }
    
    return this.emotionTargetRepository.findOneBy({
      target: target,
      emotion: emotion
    })

  }

}
