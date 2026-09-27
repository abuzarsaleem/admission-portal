import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';

export class ApplicantListQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Page number (1-based)',
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
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class ApplicantIntakeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  intakeName!: string;

  @ApiProperty()
  intakeCode!: string;

  @ApiProperty()
  applicationOpenAt!: string;

  @ApiProperty()
  applicationCloseAt!: string;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: string | null;
}

export class ApplicantIntakeListDto {
  @ApiProperty({ type: [ApplicantIntakeDto] })
  items!: ApplicantIntakeDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class ApplicantProgrammeSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  degreeLevel!: string;

  @ApiPropertyOptional({ nullable: true })
  programmeGrouping!: string | null;
}

export class ApplicantOfferingDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  intakeId!: string;

  @ApiProperty()
  programmeId!: string;

  @ApiProperty({ type: ApplicantProgrammeSummaryDto })
  programme!: ApplicantProgrammeSummaryDto;

  @ApiProperty()
  publishedDescription!: string;

  @ApiPropertyOptional({ nullable: true })
  displayOrder!: number | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: string | null;
}

export class ApplicantOfferingListDto {
  @ApiProperty({ type: [ApplicantOfferingDto] })
  items!: ApplicantOfferingDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class ApplicantCriterionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  criteriaTypeId!: string;

  @ApiPropertyOptional({ nullable: true })
  criteriaName!: string | null;

  @ApiProperty()
  criteriaRequirement!: string;

  @ApiPropertyOptional({ nullable: true })
  criteriaOperator!: string | null;

  @ApiPropertyOptional({ nullable: true })
  criteriaUnit!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 65 })
  criteriaValue!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 80 })
  criteriaValueMax!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'FSC' })
  appliesToDegreeType!: string | null;

  @ApiProperty()
  mandatory!: boolean;

  @ApiPropertyOptional({ nullable: true })
  sequenceNo!: number | null;
}

export class ApplicantFeeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  feeType!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  effectiveFrom!: string | null;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sortOrder!: number | null;
}

export class ApplicantDeclarationDto {
  @ApiProperty({ description: 'Offering declaration UUID' })
  id!: string;

  @ApiProperty()
  programmeOfferingId!: string;

  @ApiProperty()
  declarationTypeId!: string;

  @ApiProperty({ description: 'Declaration / terms text shown to the applicant' })
  declarationText!: string;

  @ApiProperty({ example: 'DECL-1.0' })
  version!: string;

  @ApiProperty()
  effectiveFrom!: string;

  @ApiPropertyOptional({ nullable: true })
  effectiveTo!: string | null;
}

export class StartApplicationResponseDto {
  @ApiProperty({ example: 'ADM-F001' })
  targetFeature!: string;

  @ApiProperty()
  offeringId!: string;

  @ApiProperty()
  intakeId!: string;

  @ApiProperty()
  programmeId!: string;

  @ApiProperty({
    description: 'Handoff payload for ADM-F001 application start',
  })
  handoff!: {
    tenantId: string;
    intakeId: string;
    offeringId: string;
    programmeId: string;
    applicantUserId: string;
  };

  @ApiProperty({
    example: '/api/v1/applications/start',
    description: 'Suggested ADM-F001 entry path (not implemented in ADM-F000)',
  })
  nextAction!: string;
}
