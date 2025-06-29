import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommonUtilService {
  generateUUID() {
    return uuidv4();
  }

  getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // 예: 2025-06-27
  }

  getCurrentDateToISOString(): Date {
    const now = new Date();
    // 시간 성분은 무시하고 ‘오늘’만 쓰고 싶다면…
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  parseEnumValue<E extends { [K in keyof E]: string }>(
    enumObj: E,
    value: string,
  ): E[keyof E] {
    // enumObj의 값들만 뽑아서 string[]으로 만든 뒤 includes 검사
    const enumValues = Object.values(enumObj) as string[];
    if (enumValues.includes(value)) {
      // value가 enum 값 중 하나이므로, 타입 단언을 통해 반환
      return value as E[keyof E];
    }
    // @ts-ignore
    return "DEFAULT"
  }
}
