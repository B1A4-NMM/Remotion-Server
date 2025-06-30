import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';
import { EmotionType, isEmotionType } from '../enums/emotion-type.enum';
import { EmotionAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { CommonUtilService } from '../util/common-util.service';

@Injectable()
export class EmotionService {
  constructor(
    @InjectRepository(EmotionTarget) private readonly emotionTargetRepository: Repository<EmotionTarget>,
    private readonly util:CommonUtilService,
  ) {}

  async createByTarget(target: Target, dtos:EmotionAnalysisDto[]) {
    for (const dto of dtos) {

      console.log(`target = ${target.name} 감정 = ${dto.emotionType}`)

      const emotion = dto.emotionType // 감정 타입
      const emotionIntensity = dto.intensity // 감정 강도
      let find = await this.findOne(target, emotion);
      if (find === null) {
        find = new EmotionTarget(
          this.util.parseEnumValue(EmotionType, emotion),
          target,
          emotionIntensity,
          1
        )
      } else {
        find.emotion_intensity += emotionIntensity
        find.count += 1
      }

      await this.emotionTargetRepository.save(find)
    }
  }

  findOne(target: Target, emotion: string) {
    if (!isEmotionType(emotion)) {
      throw new NotFoundException('emotion type is not valid')
    }
    
    return this.emotionTargetRepository.findOneBy({
      target: target,
      emotion: emotion
    })

  }

}
