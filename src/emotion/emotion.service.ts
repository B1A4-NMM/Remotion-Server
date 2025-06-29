import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';

@Injectable()
export class EmotionService {
  constructor(
    @InjectRepository(EmotionTarget) private readonly emotionTargetRepository: Repository<EmotionTarget>,
  ) {}

  createByTarget(target: Target, dto:any) {



  }

  findOne(target: Target, emotion: string) {
  }

}
