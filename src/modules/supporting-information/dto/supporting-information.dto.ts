import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import {
  SupportingInformationStatus,
  SupportingInformationType,
} from '../../../common/enums/supporting-information.enum.js';
import { AtLeastOneOfConstraint } from '../../../common/validators/intake.validators.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSupportingInformationDto {
  @ApiProperty({
    enum: SupportingInformationType,
    example: SupportingInformationType.INSTRUCTION,
  })
  @IsEnum(SupportingInformationType)
  informationType!: SupportingInformationType;

  @ApiProperty({
    example: 'Application instruction',
    minLength: 3,
    maxLength: 255,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'Complete the online application and upload required documents.',
    minLength: 5,
    maxLength: 10000,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional({
    example: 'https://admissions.example.edu/apply',
    nullable: true,
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(
    { require_protocol: true },
    { message: 'referenceUrl must be a valid URL with protocol' },
  )
  referenceUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Required for publication readiness when true',
    example: true,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  mandatory?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number | null;
}

export class UpdateSupportingInformationDto {
  @ApiPropertyOptional({ enum: SupportingInformationType })
  @IsOptional()
  @IsEnum(SupportingInformationType)
  informationType?: SupportingInformationType;

  @ApiPropertyOptional({ minLength: 3, maxLength: 255 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ minLength: 5, maxLength: 10000 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(10000)
  content?: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 1000 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUrl(
    { require_protocol: true },
    { message: 'referenceUrl must be a valid URL with protocol' },
  )
  referenceUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  mandatory?: boolean;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number | null;

  @ApiPropertyOptional({ enum: SupportingInformationStatus })
  @IsOptional()
  @IsEnum(SupportingInformationStatus)
  status?: SupportingInformationStatus;

  @ApiHideProperty()
  @Allow()
  @Validate(
    AtLeastOneOfConstraint,
    [
      'informationType',
      'title',
      'content',
      'referenceUrl',
      'mandatory',
      'displayOrder',
      'status',
    ],
    {
      message: 'At least one updatable field is required',
    },
  )
  private readonly _atLeastOne = true;
}

export class SupportingInformationResponseDto {
  @ApiProperty({ example: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1' })
  id!: string;

  @ApiProperty({ example: '90000000-0000-4000-8000-000000009001' })
  tenantId!: string;

  @ApiProperty({ example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' })
  programmeOfferingId!: string;

  @ApiProperty({ enum: SupportingInformationType })
  informationType!: SupportingInformationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({ nullable: true })
  referenceUrl!: string | null;

  @ApiProperty()
  mandatory!: boolean;

  @ApiPropertyOptional({ nullable: true })
  displayOrder!: number | null;

  @ApiProperty({ enum: SupportingInformationStatus })
  status!: SupportingInformationStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  updatedBy!: string;
}
