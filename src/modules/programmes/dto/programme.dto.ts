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
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';
import {
  DegreeLevel,
  MasterStatus,
} from '../../../common/enums/master-data.enum.js';
import { AtLeastOneOfConstraint } from '../../../common/validators/intake.validators.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export class CreateProgrammeDto {
  @ApiProperty({
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    description: 'Owning department UUID (must be ACTIVE)',
  })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ example: 'BSCS', minLength: 1, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_PATTERN, {
    message:
      'code must start with alphanumeric and contain only letters, numbers, ".", "_" or "-"',
  })
  @MaxLength(100)
  code!: string;

  @ApiProperty({
    example: 'BS Computer Science',
    minLength: 2,
    maxLength: 255,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 150 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(150)
  programmeGrouping?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(255)
  curriculumReference?: string | null;

  @ApiProperty({ enum: DegreeLevel, example: DegreeLevel.Bachelor })
  @IsEnum(DegreeLevel)
  degreeLevel!: DegreeLevel;

  @ApiPropertyOptional({ example: 1, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number | null;
}

export class UpdateProgrammeDto {
  @ApiPropertyOptional({ example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'BSCS', maxLength: 100 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_PATTERN, {
    message:
      'code must start with alphanumeric and contain only letters, numbers, ".", "_" or "-"',
  })
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ example: 'BS Computer Science', maxLength: 255 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 2000 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 150 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(150)
  programmeGrouping?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(255)
  curriculumReference?: string | null;

  @ApiPropertyOptional({ enum: DegreeLevel })
  @IsOptional()
  @IsEnum(DegreeLevel)
  degreeLevel?: DegreeLevel;

  @ApiPropertyOptional({ enum: MasterStatus })
  @IsOptional()
  @IsEnum(MasterStatus)
  status?: MasterStatus;

  @ApiPropertyOptional({ example: 1, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number | null;

  @ApiHideProperty()
  @Allow()
  @Validate(
    AtLeastOneOfConstraint,
    [
      'departmentId',
      'code',
      'name',
      'description',
      'programmeGrouping',
      'curriculumReference',
      'degreeLevel',
      'status',
      'sortOrder',
    ],
    { message: 'At least one updatable field is required' },
  )
  private readonly _atLeastOne = true;
}

export class ListProgrammesQueryDto {
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

  @ApiPropertyOptional({ enum: MasterStatus })
  @IsOptional()
  @IsEnum(MasterStatus)
  status?: MasterStatus;

  @ApiPropertyOptional({
    description: 'Filter by department UUID',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class ProgrammeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  departmentId!: string;

  @ApiProperty({ example: 'BSCS' })
  code!: string;

  @ApiProperty({ example: 'BS Computer Science' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  programmeGrouping!: string | null;

  @ApiPropertyOptional({ nullable: true })
  curriculumReference!: string | null;

  @ApiProperty({ enum: DegreeLevel })
  degreeLevel!: DegreeLevel;

  @ApiProperty({ enum: MasterStatus })
  status!: MasterStatus;

  @ApiPropertyOptional({ nullable: true, example: 1 })
  sortOrder!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  updatedBy!: string;
}

export class ProgrammeListResponseDto {
  @ApiProperty({ type: [ProgrammeResponseDto] })
  items!: ProgrammeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
