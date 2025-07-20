import { ValueTransformer } from 'typeorm';
import { LocalDate } from 'js-joda';

export class LocalDateTransformer implements ValueTransformer {
  from(value: any): LocalDate | null {
    if (!value) return null;

    if (value instanceof LocalDate) {
      return value;
    }

    if (typeof value === 'string' || value instanceof String) {
      return LocalDate.parse(value.toString());
    }

    if (value instanceof Date) {
      return LocalDate.parse(value.toISOString().slice(0, 10));
    }

    if (typeof value === 'object' && value !== null) {
      try {
        // Handle cases where the value is an object with a toString method that returns a valid date string
        return LocalDate.parse(value.toString());
      } catch (e) {
        // If parsing fails, fall through to the error
      }
    }

    throw new Error(
      `LocalDateTransformer.from(): Unsupported value type for LocalDate: ${JSON.stringify(value)}`
    );
  }

  to(value: LocalDate | null): string | null {
    return value ? value.toString() : null;
  }
}
