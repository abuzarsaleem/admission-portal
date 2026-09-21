import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';

const FEE_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;

export class CreateFeeTypeDto {
  @ApiProperty({
    description: 'Unique uppercase fee type code/name',
    example: 'APPLICATION',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(FEE_TYPE_PATTERN, {
    message:
      'name must be uppercase letters/numbers/underscores (2–50 chars, e.g. APPLICATION)',
  })
  @MaxLength(50)
  name!: string;
}

export class FeeTypeResponseDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111001' })
  id!: string;

  @ApiProperty({ example: 'APPLICATION' })
  name!: string;
}

export class FeeTypeListResponseDto {
  @ApiProperty({ type: [FeeTypeResponseDto] })
  items!: FeeTypeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
