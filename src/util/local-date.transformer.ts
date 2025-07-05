import { ValueTransformer } from 'typeorm';
import { LocalDate } from 'js-joda';

export class LocalDateTransformer implements ValueTransformer {
  from(value: Date | string | null): LocalDate | null {
    if (!value) return null;
    const iso = typeof value === 'string' ? value : value.toISOString();
    return LocalDate.parse(iso.slice(0, 10));
  }

  to(value: LocalDate | null): string | null {
    return value ? value.toString() : null;
  }
}
