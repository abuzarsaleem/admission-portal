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
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { FeeStatus } from '../../../common/enums/fee-status.enum.js';
import {
  AtLeastOneOfConstraint,
  IsAfterDate,
} from '../../../common/validators/intake.validators.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const toDateOrNull = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
};

const FEE_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{1,49}$/;

@ValidatorConstraint({ name: 'createOfferingFeeItemSource', async: false })
class CreateOfferingFeeItemSourceConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const o = args.object as CreateOfferingFeeItemDto;
    if (o.generalFeeId) return true;
    return (
      typeof o.feeType === 'string' &&
      o.feeType.length > 0 &&
      typeof o.amount === 'number' &&
      Number.isFinite(o.amount) &&
      typeof o.currency === 'string' &&
      /^[A-Z]{3}$/.test(o.currency)
    );
  }

  defaultMessage(): string {
    return 'Provide either generalFeeId, or feeType + amount + currency';
  }
}

/** One fee definition to attach to every offering in `offeringIds`. */
export class CreateOfferingFeeItemDto {
  @ApiPropertyOptional({
    description:
      'Option A: existing general fee UUID to attach. Mutually exclusive with feeType/amount/currency.',
    example: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'generalFeeId must be a valid UUID' })
  generalFeeId?: string;

  @ApiPropertyOptional({
    description:
      'Option B: fee type code (with amount + currency). Ignored when generalFeeId is set.',
    example: 'APPLICATION',
  })
  @ValidateIf((o: CreateOfferingFeeItemDto) => !o.generalFeeId)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'feeType is required when generalFeeId is not provided' })
  @Matches(FEE_TYPE_PATTERN, {
    message:
      'feeType must be uppercase letters/numbers/underscores (2–50 chars)',
  })
  feeType?: string;

  @ApiPropertyOptional({
    description: 'Option B: fee amount (>= 0). Required with feeType + currency.',
    example: 2500,
    minimum: 0,
  })
  @ValidateIf((o: CreateOfferingFeeItemDto) => !o.generalFeeId)
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount must be a number with at most 2 decimal places' },
  )
  @Min(0, { message: 'amount must be >= 0' })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Option B: ISO currency code. Required with feeType + amount.',
    example: 'PKR',
  })
  @ValidateIf((o: CreateOfferingFeeItemDto) => !o.generalFeeId)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty({
    message: 'currency is required when generalFeeId is not provided',
  })
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({
    example: '2026-07-01T00:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Transform(toDateOrNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDate({ message: 'effectiveFrom must be a valid ISO-8601 datetime' })
  effectiveFrom?: Date | null;

  @ApiPropertyOptional({
    example: '2026-09-15T23:59:59.000Z',
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

  @ApiPropertyOptional({ example: 1, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number | null;

  @ApiHideProperty()
  @Allow()
  @Validate(CreateOfferingFeeItemSourceConstraint, [], {
    message: 'Provide either generalFeeId, or feeType + amount + currency',
  })
  private readonly _sourceCheck = true;
}

export class CreateOfferingFeeDto {
  @ApiProperty({
    description: 'One or more editable offering UUIDs to attach each fee to',
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
    description: 'One or more fees to attach to every offering in offeringIds',
    type: [CreateOfferingFeeItemDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'fees must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOfferingFeeItemDto)
  fees!: CreateOfferingFeeItemDto[];
}

export class UpdateOfferingFeeDto {
  @ApiPropertyOptional({
    description: 'Update amount on the linked general fee',
    example: 3000,
    minimum: 0,
  })
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
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ enum: FeeStatus, example: FeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Transform(toDateOrNull)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsDate({ message: 'effectiveFrom must be a valid ISO-8601 datetime' })
  effectiveFrom?: Date | null;

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({ example: 2, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number | null;

  @ApiHideProperty()
  @Allow()
  @Validate(
    AtLeastOneOfConstraint,
    ['amount', 'currency', 'status', 'effectiveFrom', 'effectiveTo', 'sortOrder'],
    {
      message:
        'At least one updatable field is required (amount, currency, status, effectiveFrom, effectiveTo, sortOrder)',
    },
  )
  private readonly _atLeastOne = true;
}

export class OfferingFeeResponseDto {
  @ApiProperty({
    example: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
    description: 'Fee configuration ID (offering_fees.id)',
  })
  id!: string;

  @ApiProperty({ example: '90000000-0000-4000-8000-000000009001' })
  tenantId!: string;

  @ApiProperty({ example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1' })
  programmeOfferingId!: string;

  @ApiProperty({ example: 'ffffffff-ffff-4fff-8fff-fffffffffff2' })
  generalFeeId!: string;

  @ApiProperty({ example: 'APPLICATION' })
  feeType!: string;

  @ApiProperty({ example: '2500.00' })
  amount!: string;

  @ApiProperty({ example: 'PKR' })
  currency!: string;

  @ApiProperty({ enum: FeeStatus, example: FeeStatus.ACTIVE })
  status!: FeeStatus;

  @ApiPropertyOptional({ nullable: true })
  effectiveFrom!: string | null;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 1 })
  sortOrder!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ example: '50000000-0000-4000-8000-000000005001' })
  createdBy!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ example: '50000000-0000-4000-8000-000000005001' })
  updatedBy!: string;
}

export class OfferingFeeBatchResponseDto {
  @ApiProperty({ type: [OfferingFeeResponseDto] })
  items!: OfferingFeeResponseDto[];
}
