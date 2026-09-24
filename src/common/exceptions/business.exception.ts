import { HttpException, HttpStatus } from '@nestjs/common';

/** Domain/business rule violation (ADM-F000 authorization & readiness rules). */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(
      {
        statusCode: status,
        message,
        code: code ?? 'BUSINESS_RULE_VIOLATION',
        ...(details !== undefined ? { details } : {}),
      },
      status,
    );
  }
}
