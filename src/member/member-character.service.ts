import { Injectable,Logger,BadRequestException } from '@nestjs/common';
import {
    ConnectedRelationEmotions,
    DistancedRelationEmotions,
    getRelationLabel,
    getSelfLabel,
    getStateLabel,
  } from '../enums/emotion-type.enum';

  import {
    EmotionBaseAnalysisResponseDto,
    EmotionBaseAnalysisDto,
  } from '../emotion/dto/emotion-base-analysis.dto';

  import { CharacterResponseDto } from './dto/member-character-response.dto';

  import { CharacterAnimalMap, CharacterKey } from '../constants/character-map'
import { EmotionService } from '../emotion/emotion.service';

@Injectable()
export class MemberCharacterService {

    private readonly logger =new Logger(MemberCharacterService.name);

    constructor( 
        private readonly emotionService: EmotionService,
    ){}

    async getMemberCharacter(memberId:string):Promise<CharacterResponseDto>{
        
        this.logger.debug(`getMemberCharacter 호출 - memberId: ${memberId}`);
        
        const emotionBaseResult =await this.emotionService.getEmotionBaseAnalysis(memberId);

        const hasSufficientData =
        emotionBaseResult.Relation?.length &&
        emotionBaseResult.State?.length &&
        emotionBaseResult.Self?.length;

    if (!hasSufficientData) {
      this.logger.warn(
        '분석 가능한 감정 데이터가 부족하여 캐릭터를 unknown으로 반환합니다.'
      );
      return { character: 'unknown' };
    }

        const character=this.classifyCharacter(emotionBaseResult);
        this.logger.log(`분류된 캐릭터: ${character}`);

        return { character };
        //Dto 형식이랑 동일하게 반환해주기
    }

    
    private classifyCharacter(result: EmotionBaseAnalysisResponseDto): string {
        // ✅ 감정 데이터 유효성 검사
        if (!result.Relation?.length || !result.State?.length || !result.Self?.length) {
            throw new BadRequestException('분석 가능한 감정 데이터가 부족합니다. 최소 3가지 감정 베이스가 필요합니다.');
      }

        const pickTopEmotion =(emotions : EmotionBaseAnalysisDto[], base:string ):EmotionBaseAnalysisDto=>{
            const sorted = emotions.sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                if (b.intensity !== a.intensity) return b.intensity - a.intensity;
                return 0;
              });
              this.logger.debug(`${base} Top 감정: ${JSON.stringify(sorted[0])}`);
              return sorted[0];
        };
       const relationTop =pickTopEmotion(result.Relation,'Relation');
       const stateTop =pickTopEmotion(result.State,'State');
       const selfTop =pickTopEmotion(result.Self,'Self');

        const relationLabel = getRelationLabel(relationTop.emotion);
        //emotion,intensity,count 속성 중에 emotion
        const stateLabel =getStateLabel(stateTop.emotion);
        const selfLabel = getSelfLabel(selfTop.emotion);

        const key:CharacterKey = `${relationLabel}-${stateLabel}-${selfLabel}`;
        this.logger.verbose(`최종 캐릭터 키: ${key}`);
        /* 
        [verbose] : 중간 처리 상태 등 자세한 설명용 로그
        */

        return CharacterAnimalMap[key];
    }


}
  
