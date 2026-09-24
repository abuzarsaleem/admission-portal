import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception.js';

export function assertPasswordStrength(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new BusinessException(
      'Password must be between 8 and 128 characters',
      HttpStatus.BAD_REQUEST,
      'WEAK_PASSWORD',
    );
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new BusinessException(
      'Password must include letters and numbers',
      HttpStatus.BAD_REQUEST,
      'WEAK_PASSWORD',
    );
  }
  if (!/[A-Z]/.test(password)) {
    throw new BusinessException(
      'Password must include at least 1 uppercase letter',
      HttpStatus.BAD_REQUEST,
      'WEAK_PASSWORD',
    );
  }
}
