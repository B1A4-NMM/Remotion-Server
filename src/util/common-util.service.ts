import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LocalDate } from 'js-joda';
import { DayOfWeek } from '@js-joda/core';
import { EmotionType } from '../enums/emotion-type.enum';
import { CombinedEmotion, EmotionInteraction } from './json.parser';

@Injectable()
export class CommonUtilService {
  
  private readonly logger = new Logger(CommonUtilService.name);
  
  generateUUID() {
    return uuidv4();
  }

  getCurrentDate() {
    return LocalDate.now().toString();
  }

  getWeekDay(date: LocalDate) {
    const dayOfWeek = date.dayOfWeek();
    return dayOfWeek.toString();
  }

  parseEnumValue<E extends { [K in keyof E]: string }>(
    enumObj: E,
    value: string,
  ): E[keyof E] | null {
    const enumValues = Object.values(enumObj) as string[];
    if (enumValues.includes(value)) {
      return value as E[keyof E];
    }
    return null; // 유효하지 않은 값은 null 반환
  }

  toCombinedEmotionTyped(ei: EmotionInteraction | undefined): CombinedEmotion[] {
    if (!ei || !ei.emotion || !ei.emotion_intensity) {
      return [];
    }

    return ei.emotion.map((e, i) => {
      const emotionType = this.parseEnumValue(EmotionType, e);
      if (emotionType === null) {
        return null; // 유효하지 않은 감정은 null로 표시
      }
      return {
        emotion: emotionType,
        intensity: ei.emotion_intensity[i],
      };
    }).filter(Boolean) as CombinedEmotion[]; // null 값 필터링
  }

  pickRandomUnique<T>(arr: T[], count: number): T[] {
    if (count > arr.length) {
      count = arr.length;
      this.logger.warn("배열의 길이보다 요청한 갯수가 큽니다")
    }

    const result: T[] = [];
    const usedIndices = new Set<number>();

    while (result.length < count) {
      const i = Math.floor(Math.random() * arr.length);
      if (!usedIndices.has(i)) {
        usedIndices.add(i);
        result.push(arr[i]);
      }
    }

    return result;
  }

}
