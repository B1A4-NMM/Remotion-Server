import { ValueTransformer } from 'typeorm';
import { LocalDate } from 'js-joda';

export class LocalDateTransformer implements ValueTransformer {
  from(value: Date | string | null): LocalDate | null {
    if (!value) return null;

    if (typeof value === 'string' || value instanceof String) {
      // 진짜 문자열이든 String 객체든 전부 처리
      return LocalDate.parse(value.toString());
    }

    if (value instanceof Date) {
      return LocalDate.parse(value.toISOString().slice(0, 10));
    }

    throw new Error(
      `LocalDateTransformer.from(): Unsupported value type for LocalDate: ${JSON.stringify(value)}`
    );
  }

  to(value: LocalDate | null): string | null {
    return value ? value.toString() : null;
  }
}
