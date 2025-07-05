import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LocalDate } from 'js-joda';
import { DayOfWeek } from '@js-joda/core';

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
    return "DEFAULT"
  }
}
