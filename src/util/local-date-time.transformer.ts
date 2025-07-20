// src/util/local-date-time.transformer.ts
import { ValueTransformer } from 'typeorm';
import { LocalDateTime } from 'js-joda';

export class LocalDateTimeTransformer implements ValueTransformer {
  to(entityValue: LocalDateTime | null): string | null {
    if (entityValue === null) {
      return null;
    }
    // LocalDateTime을 ISO 8601 문자열로 변환하여 DB에 저장
    return entityValue.toString();
  }

  from(databaseValue: string | null): LocalDateTime | null {
    if (databaseValue === null || databaseValue === '') {
      return null;
    }
    // DB에서 읽어온 문자열을 LocalDateTime 객체로 변환
    return LocalDateTime.parse(databaseValue);
  }
}