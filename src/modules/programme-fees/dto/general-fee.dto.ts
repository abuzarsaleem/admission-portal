import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';
import { FeeStatus } from '../../../common/enums/fee-status.enum.js';
import { AtLeastOneOfConstraint } from '../../../common/validators/intake.validators.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const FEE_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;

export class CreateGeneralFeeDto {
  @ApiProperty({
    description: 'Fee type code from fee_types catalogue',
    example: 'APPLICATION',
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Matches(FEE_TYPE_PATTERN, {
    message: 'feeType must be an uppercase catalogue code (e.g. APPLICATION)',
  })
  @MaxLength(50)
  feeType!: string;

  @ApiProperty({ example: 2500, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiProperty({ example: 'PKR', minLength: 3, maxLength: 3 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency!: string;
}

export class UpdateGeneralFeeDto {
  @ApiPropertyOptional({ example: 3000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 'PKR' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ enum: FeeStatus })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiHideProperty()
  @Allow()
  @Validate(AtLeastOneOfConstraint, ['amount', 'currency', 'status'], {
    message: 'At least one of amount, currency, or status is required',
  })
  private readonly _atLeastOne = true;
}

export class ListGeneralFeesQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: FeeStatus })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({ example: 'APPLICATION' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  feeType?: string;
}

export class GeneralFeeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ example: 'APPLICATION' })
  feeType!: string;

  @ApiProperty({ example: '2500.00' })
  amount!: string;

  @ApiProperty({ example: 'PKR' })
  currency!: string;

  @ApiProperty({ enum: FeeStatus })
  status!: FeeStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  updatedBy!: string;
}

export class GeneralFeeListResponseDto {
  @ApiProperty({ type: [GeneralFeeResponseDto] })
  items!: GeneralFeeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
