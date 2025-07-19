import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  getRelationLabel,
  getSelfLabel,
  getStateLabel,
} from '../enums/emotion-type.enum';

import {
  EmotionBaseAnalysisDto,
  EmotionBaseAnalysisResponseDto,
} from '../emotion/dto/emotion-base-analysis.dto';

import { CharacterResponseDto } from './dto/member-character-response.dto';

import { CharacterAnimalMap, CharacterKey } from '../constants/character-map';
import { EmotionService } from '../emotion/emotion.service';
import { MemberService } from './member.service';
import { NotificationService } from '../notification/notification.service';
import { changeCharacterMessage } from '../constants/noti-message.constants';
import { NotificationType } from '../enums/notification-type.enum';

@Injectable()
export class MemberCharacterService {
  private readonly logger = new Logger(MemberCharacterService.name);

  constructor(
    private readonly emotionService: EmotionService,
    private readonly memberService: MemberService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 사용자에게 어울리는 캐릭터를 계산합니다
   */
  async calculateMemberCharacter(
    memberId: string,
  ) {
    this.logger.debug(`calculateMemberCharacter 호출 - memberId: ${memberId}`);

    const member = await this.memberService.findOne(memberId);
    const prevCharacter = member.character;

    const emotionBaseResult =
      await this.emotionService.getEmotionBaseAnalysis(memberId);

    const hasSufficientData =
      emotionBaseResult.Relation?.length &&
      emotionBaseResult.State?.length &&
      emotionBaseResult.Self?.length;

    if (!hasSufficientData) {
      this.logger.warn(
        '분석 가능한 감정 데이터가 부족하여 캐릭터를 unknown으로 반환합니다.',
      );
      return 'unknown';
    }

    const newCharacter = this.classifyCharacter(emotionBaseResult);
    this.logger.log(`분류된 캐릭터: ${newCharacter}`);

    if (prevCharacter != newCharacter){
      await this.notificationService.createCharacterNotification(
        memberId,
      );
    }


    return newCharacter
  }

  /**
   * 감정을 분석해 캐릭터를 뽑습니다
   */
  private classifyCharacter(result: EmotionBaseAnalysisResponseDto): string {
    // ✅ 감정 데이터 유효성 검사
    if (
      !result.Relation?.length ||
      !result.State?.length ||
      !result.Self?.length
    ) {
      throw new BadRequestException(
        '분석 가능한 감정 데이터가 부족합니다. 최소 3가지 감정 베이스가 필요합니다.',
      );
    }

    const pickTopEmotion = (
      emotions: EmotionBaseAnalysisDto[],
      base: string,
    ): EmotionBaseAnalysisDto => {
      const sorted = emotions.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.intensity !== a.intensity) return b.intensity - a.intensity;
        return 0;
      });
      this.logger.debug(`${base} Top 감정: ${JSON.stringify(sorted[0])}`);
      return sorted[0];
    };
    const relationTop = pickTopEmotion(result.Relation, 'Relation');
    const stateTop = pickTopEmotion(result.State, 'State');
    const selfTop = pickTopEmotion(result.Self, 'Self');

    const relationLabel = getRelationLabel(relationTop.emotion);
    //emotion,intensity,count 속성 중에 emotion
    const stateLabel = getStateLabel(stateTop.emotion);
    const selfLabel = getSelfLabel(selfTop.emotion);

    const key: CharacterKey = `${relationLabel}-${stateLabel}-${selfLabel}`;
    this.logger.verbose(`최종 캐릭터 키: ${key}`);
    /* 
    [verbose] : 중간 처리 상태 등 자세한 설명용 로그
    */

    return CharacterAnimalMap[key];
  }

  /**
   * 현재 멤버의 캐릭터 반환
   */
  async getMemberCharacter(memberId: string) {
    const member = await this.memberService.findOne(memberId);
    let dto = new CharacterResponseDto();
    dto.character = member.character;
    return dto;
  }
}
