import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';
import { MasterStatus } from '../../../common/enums/master-data.enum.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export enum CriteriaValueDataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  PERCENTAGE = 'PERCENTAGE',
}

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;

export class CreateCriteriaTypeDto {
  @ApiProperty({
    description: 'Unique uppercase catalogue code',
    example: 'MIN_PERCENTAGE',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_PATTERN, {
    message:
      'code must be uppercase letters/numbers/underscores (2–50 chars, e.g. MIN_PERCENTAGE)',
  })
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'Minimum Percentage', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Minimum overall academic percentage',
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({
    enum: CriteriaValueDataType,
    example: CriteriaValueDataType.PERCENTAGE,
    default: CriteriaValueDataType.TEXT,
  })
  @IsOptional()
  @IsEnum(CriteriaValueDataType)
  valueDataType?: CriteriaValueDataType;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number | null;
}

export class CriteriaTypeResponseDto {
  @ApiProperty({ example: '22222222-2222-4222-8222-222222222002' })
  id!: string;

  @ApiProperty({ example: 'MIN_PERCENTAGE' })
  code!: string;

  @ApiProperty({ example: 'Minimum Percentage' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: CriteriaValueDataType, example: CriteriaValueDataType.NUMBER })
  valueDataType!: string;

  @ApiProperty({ enum: MasterStatus, example: MasterStatus.ACTIVE })
  status!: string;

  @ApiPropertyOptional({ nullable: true, example: 2 })
  sortOrder!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CriteriaTypeListResponseDto {
  @ApiProperty({ type: [CriteriaTypeResponseDto] })
  items!: CriteriaTypeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
