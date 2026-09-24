import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';
import { DeclarationStatus } from '../../../common/enums/declaration-status.enum.js';
import {
  AtLeastOneOfConstraint,
  IsAfterDate,
} from '../../../common/validators/intake.validators.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const toIdString = ({ value }: { value: unknown }) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === 'string') return value.trim();
  return value;
};

const toDateOrNull = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
};

const toRequiredDate = ({ value }: { value: unknown }) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
};

export class CreateGeneralDeclarationDto {
  @ApiProperty({
    description: 'Declaration type UUID from declaration_types catalogue',
    example: '33333333-3333-4333-8333-333333333001',
  })
  @Transform(toIdString)
  @IsUUID(undefined, { message: 'declarationTypeId must be a valid UUID' })
  declarationTypeId!: string;

  @ApiProperty({
    description: 'Declaration content shown to applicants',
    example: 'I hereby declare that all information provided is true...',
    minLength: 2,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'declarationText is required' })
  @MinLength(2)
  declarationText!: string;

  @ApiProperty({
    description: 'Declaration version label',
    example: '1.0',
    maxLength: 100,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  version!: string;

  @ApiProperty({
    example: '2026-07-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Transform(toRequiredDate)
  @IsDate({ message: 'effectiveFrom must be a valid ISO-8601 datetime' })
  effectiveFrom!: Date;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Transform(toDateOrNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDate({ message: 'effectiveTo must be a valid ISO-8601 datetime' })
  @ValidateIf((o) => o.effectiveFrom != null && o.effectiveTo != null)
  @IsAfterDate('effectiveFrom', {
    message: 'effectiveTo must be after effectiveFrom',
  })
  effectiveTo?: Date | null;

  @ApiPropertyOptional({
    enum: DeclarationStatus,
    default: DeclarationStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;
}

export class UpdateGeneralDeclarationDto {
  @ApiPropertyOptional({
    example: 'I hereby declare that all information provided is true...',
    minLength: 2,
  })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  declarationText?: string;

  @ApiPropertyOptional({ example: '1.1', maxLength: 100 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  version?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Transform(toRequiredDate)
  @IsDate({ message: 'effectiveFrom must be a valid ISO-8601 datetime' })
  effectiveFrom?: Date;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Transform(toDateOrNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDate({ message: 'effectiveTo must be a valid ISO-8601 datetime' })
  effectiveTo?: Date | null;

  @ApiPropertyOptional({ enum: DeclarationStatus })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;

  @ApiHideProperty()
  @Allow()
  @Validate(
    AtLeastOneOfConstraint,
    [
      'declarationText',
      'version',
      'effectiveFrom',
      'effectiveTo',
      'status',
    ],
    {
      message:
        'At least one of declarationText, version, effectiveFrom, effectiveTo, or status is required',
    },
  )
  private readonly _atLeastOne = true;
}

export class ListGeneralDeclarationsQueryDto {
  @ApiPropertyOptional({ type: Number, example: 1, minimum: 1, default: 1 })
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

  @ApiPropertyOptional({ enum: DeclarationStatus })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;

  @ApiPropertyOptional({
    description: 'Filter by declaration type UUID',
    example: '33333333-3333-4333-8333-333333333001',
  })
  @IsOptional()
  @Transform(toIdString)
  @IsUUID(undefined, { message: 'declarationTypeId must be a valid UUID' })
  declarationTypeId?: string;
}

export class GeneralDeclarationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ example: '33333333-3333-4333-8333-333333333001' })
  declarationTypeId!: string;

  @ApiProperty()
  declarationText!: string;

  @ApiProperty({ example: '1.0' })
  version!: string;

  @ApiProperty()
  effectiveFrom!: string;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo!: string | null;

  @ApiProperty({ enum: DeclarationStatus })
  status!: DeclarationStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  updatedBy!: string;
}

export class GeneralDeclarationListResponseDto {
  @ApiProperty({ type: [GeneralDeclarationResponseDto] })
  items!: GeneralDeclarationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
