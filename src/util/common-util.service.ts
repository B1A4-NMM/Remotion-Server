import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LocalDate } from 'js-joda';
import { DayOfWeek } from '@js-joda/core';
import { EmotionType } from '../enums/emotion-type.enum';
import { CombinedEmotion, EmotionInteraction } from './json.parser';

@Injectable()
export class CommonUtilService {
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
  ): E[keyof E] {
    const enumValues = Object.values(enumObj) as string[];
    if (enumValues.includes(value)) {
      return value as E[keyof E];
    }
    // @ts-ignore
    return EmotionType.무난
  }

  toCombinedEmotionTyped(ei: EmotionInteraction | undefined): CombinedEmotion[] {
    if (!ei || !ei.emotion || !ei.emotion_intensity) {
      return [];
    }

    return ei.emotion.map((e, i) => ({
      emotion: this.parseEnumValue(EmotionType, e),
      intensity: ei.emotion_intensity[i],
    }));
  }

  pickRandomUnique<T>(arr: T[], count: number): T[] {
    if (count > arr.length) {
      throw new Error('요청한 개수가 배열 길이보다 큽니다.');
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
