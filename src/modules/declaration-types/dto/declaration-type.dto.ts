import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';
import { MasterStatus } from '../../../common/enums/master-data.enum.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;

export class CreateDeclarationTypeDto {
  @ApiProperty({ example: 'GENERAL' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_PATTERN, {
    message:
      'code must be uppercase letters/numbers/underscores (2–50 chars, e.g. GENERAL)',
  })
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: 'General Declaration', minLength: 2, maxLength: 150 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'General institutional declaration',
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
}

export class DeclarationTypeResponseDto {
  @ApiProperty({ example: '33333333-3333-4333-8333-333333333001' })
  id!: string;

  @ApiProperty({ example: 'GENERAL' })
  code!: string;

  @ApiProperty({ example: 'General Declaration' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: MasterStatus })
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class DeclarationTypeListResponseDto {
  @ApiProperty({ type: [DeclarationTypeResponseDto] })
  items!: DeclarationTypeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class ListDeclarationTypesQueryDto {
  @ApiPropertyOptional({ type: Number, example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
