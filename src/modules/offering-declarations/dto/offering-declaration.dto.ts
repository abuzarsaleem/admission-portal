import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
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

@ValidatorConstraint({
  name: 'createOfferingDeclarationItemSource',
  async: false,
})
class CreateOfferingDeclarationItemSourceConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const o = args.object as CreateOfferingDeclarationItemDto;
    if (o.generalDeclarationId) return true;
    return (
      typeof o.declarationTypeId === 'string' &&
      o.declarationTypeId.length > 0 &&
      typeof o.declarationText === 'string' &&
      o.declarationText.length >= 2 &&
      typeof o.version === 'string' &&
      o.version.length > 0 &&
      o.effectiveFrom instanceof Date
    );
  }

  defaultMessage(): string {
    return (
      'Provide either generalDeclarationId, or declarationTypeId + ' +
      'declarationText + version + effectiveFrom'
    );
  }
}

/** One declaration definition to attach to every offering in `offeringIds`. */
export class CreateOfferingDeclarationItemDto {
  @ApiPropertyOptional({
    description:
      'Option A: existing general declaration UUID to clone onto the offering. ' +
      'Mutually exclusive with inline fields.',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  @IsOptional()
  @Transform(toIdString)
  @IsUUID(undefined, { message: 'generalDeclarationId must be a valid UUID' })
  generalDeclarationId?: string;

  @ApiPropertyOptional({
    description:
      'Option B: declaration type UUID. Required with declarationText + version + effectiveFrom.',
    example: '33333333-3333-4333-8333-333333333001',
  })
  @ValidateIf((o: CreateOfferingDeclarationItemDto) => !o.generalDeclarationId)
  @Transform(toIdString)
  @IsUUID(undefined, { message: 'declarationTypeId must be a valid UUID' })
  declarationTypeId?: string;

  @ApiPropertyOptional({
    description: 'Option B: declaration content. Required when generalDeclarationId is not set.',
    example: 'I hereby declare that all information provided is true...',
  })
  @ValidateIf((o: CreateOfferingDeclarationItemDto) => !o.generalDeclarationId)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({
    message: 'declarationText is required when generalDeclarationId is not provided',
  })
  @MinLength(2)
  declarationText?: string;

  @ApiPropertyOptional({
    description: 'Option B: version label. Required when generalDeclarationId is not set.',
    example: '1.0',
    maxLength: 100,
  })
  @ValidateIf((o: CreateOfferingDeclarationItemDto) => !o.generalDeclarationId)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({
    message: 'version is required when generalDeclarationId is not provided',
  })
  @MaxLength(100)
  version?: string;

  @ApiPropertyOptional({
    description:
      'Effective start. Required for Option B; optional override when cloning (Option A).',
    example: '2026-07-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @ValidateIf(
    (o: CreateOfferingDeclarationItemDto) =>
      !o.generalDeclarationId || o.effectiveFrom !== undefined,
  )
  @Transform(toRequiredDate)
  @IsDate({ message: 'effectiveFrom must be a valid ISO-8601 datetime' })
  effectiveFrom?: Date;

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
    default: DeclarationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(DeclarationStatus)
  status?: DeclarationStatus;

  @ApiHideProperty()
  @Allow()
  @Validate(CreateOfferingDeclarationItemSourceConstraint, [], {
    message:
      'Provide either generalDeclarationId, or declarationTypeId + declarationText + version + effectiveFrom',
  })
  private readonly _sourceCheck = true;
}

export class CreateOfferingDeclarationDto {
  @ApiProperty({
    description: 'One or more editable offering UUIDs to attach each declaration to',
    type: [String],
    example: [
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    ],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'offeringIds must contain at least one UUID' })
  @ArrayUnique({ message: 'offeringIds must be unique' })
  @IsUUID(undefined, {
    each: true,
    message: 'each offeringId must be a valid UUID',
  })
  offeringIds!: string[];

  @ApiProperty({
    description:
      'One or more declarations to attach to every offering in offeringIds',
    type: [CreateOfferingDeclarationItemDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'declarations must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOfferingDeclarationItemDto)
  declarations!: CreateOfferingDeclarationItemDto[];
}

export class UpdateOfferingDeclarationDto {
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

export class OfferingDeclarationResponseDto {
  @ApiProperty({
    example: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    description: 'Offering declaration ID (offering_declarations.id)',
  })
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' })
  programmeOfferingId!: string;

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

export class OfferingDeclarationBatchResponseDto {
  @ApiProperty({ type: [OfferingDeclarationResponseDto] })
  items!: OfferingDeclarationResponseDto[];
}
