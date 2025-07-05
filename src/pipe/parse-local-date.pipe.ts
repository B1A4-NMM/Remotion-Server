import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { LocalDate } from 'js-joda';

@Injectable()
export class ParseLocalDatePipe implements PipeTransform<string, LocalDate> {
  transform(value: string, metadata: ArgumentMetadata): LocalDate {
    try {
      return LocalDate.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD.');
    }
  }
}
