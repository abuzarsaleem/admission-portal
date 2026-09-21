import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validate as isUuid } from 'uuid';

/** Validates UUID path parameters. */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  constructor(private readonly fieldName = 'id') {}

  transform(value: string): string {
    const normalized = String(value ?? '').trim();
    if (!isUuid(normalized)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `${this.fieldName} must be a valid UUID`,
      });
    }
    return normalized;
  }
}
