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
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';
import { MasterStatus } from '../../../common/enums/master-data.enum.js';
import { AtLeastOneOfConstraint } from '../../../common/validators/intake.validators.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export class CreateDepartmentDto {
  @ApiProperty({ example: 'CS', minLength: 1, maxLength: 100 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Matches(CODE_PATTERN, {
    message:
      'code must start with alphanumeric and contain only letters, numbers, ".", "_" or "-"',
  })
  @MaxLength(100)
  code!: string;

  @ApiProperty({ example: 'Computer Science', minLength: 2, maxLength: 255 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'Faculty of Computing',
    nullable: true,
    maxLength: 2000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'CS', maxLength: 100 })
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

  @ApiPropertyOptional({ example: 'Computer Science', maxLength: 255 })
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

  @ApiPropertyOptional({ enum: MasterStatus })
  @IsOptional()
  @IsEnum(MasterStatus)
  status?: MasterStatus;

  @ApiHideProperty()
  @Allow()
  @Validate(AtLeastOneOfConstraint, ['code', 'name', 'description', 'status'], {
    message: 'At least one of code, name, description, or status is required',
  })
  private readonly _atLeastOne = true;
}

export class ListDepartmentsQueryDto {
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
}

export class DepartmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ example: 'CS' })
  code!: string;

  @ApiProperty({ example: 'Computer Science' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: MasterStatus })
  status!: MasterStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  updatedBy!: string;
}

export class DepartmentListResponseDto {
  @ApiProperty({ type: [DepartmentResponseDto] })
  items!: DepartmentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

/** Combined department + programme status counts for dashboard cards. */
export class MasterDataStatsDto {
  @ApiProperty({ example: 12, description: 'Total departments' })
  totalDepartments!: number;

  @ApiProperty({ example: 10, description: 'ACTIVE departments' })
  activeDepartments!: number;

  @ApiProperty({ example: 2, description: 'INACTIVE departments' })
  inactiveDepartments!: number;

  @ApiProperty({ example: 40, description: 'Total programmes' })
  totalProgrammes!: number;

  @ApiProperty({ example: 35, description: 'ACTIVE programmes' })
  activeProgrammes!: number;

  @ApiProperty({ example: 5, description: 'INACTIVE programmes' })
  inactiveProgrammes!: number;
}
