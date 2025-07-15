import { ValueTransformer } from 'typeorm';
import { LocalDate } from 'js-joda';

export class LocalDateTransformer implements ValueTransformer {
  from(value: Date | string | null): LocalDate | null {
    if (!value) return null;

    if (typeof value === 'string') {
      // MySQL 'DATE' 타입은 이 경우임 (예: '2025-07-16')
      return LocalDate.parse(value);
    }

    if (value instanceof Date) {
      // 타입이 Date면 ISO 변환 후 앞 10자만 사용
      return LocalDate.parse(value.toISOString().slice(0, 10));
    }

    // 예외 처리: 알 수 없는 타입
    throw new Error(
      `LocalDateTransformer.from(): Unsupported value type for LocalDate: ${JSON.stringify(value)}`
    );
  }

  to(value: LocalDate | null): string | null {
    return value ? value.toString() : null;
  }
}
