import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IntakeStatus } from '../../../common/enums/intake-status.enum.js';
import { IntakeResponseDto } from '../dto/intake-response.dto.js';

export class ReturnIntakeDto {
  @ApiPropertyOptional({
    description: 'Reason for returning the intake for correction',
    example: 'Missing fee configuration on one offering',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class PublicationReadinessIssueDto {
  @ApiProperty({ example: 'MISSING_OFFERING_FEE' })
  code!: string;

  @ApiProperty({ example: 'Offering has no ACTIVE fee configuration' })
  message!: string;

  @ApiPropertyOptional({ nullable: true })
  offeringId?: string | null;
}

export class PublicationReadinessDto {
  @ApiProperty({ example: true })
  ready!: boolean;

  @ApiProperty({ type: [PublicationReadinessIssueDto] })
  issues!: PublicationReadinessIssueDto[];
}

export class IntakeReviewOfferingDto {
  @ApiProperty()
  offeringId!: string;

  @ApiProperty()
  programmeId!: string;

  @ApiProperty()
  offeringStatus!: string;

  @ApiProperty()
  publishedDescription!: string;

  @ApiProperty()
  criteriaCount!: number;

  @ApiProperty()
  activeFeeCount!: number;

  @ApiProperty()
  supportingInformationCount!: number;

  @ApiProperty()
  missingMandatorySupportingInfo!: number;
}

export class IntakeReviewPackageDto {
  @ApiProperty({ type: IntakeResponseDto })
  intake!: IntakeResponseDto;

  @ApiProperty({ type: PublicationReadinessDto })
  readiness!: PublicationReadinessDto;

  @ApiProperty({ type: [IntakeReviewOfferingDto] })
  offerings!: IntakeReviewOfferingDto[];
}

export class IntakeWorkflowResponseDto {
  @ApiProperty({ type: IntakeResponseDto })
  intake!: IntakeResponseDto;

  @ApiProperty({ enum: IntakeStatus })
  previousStatus!: IntakeStatus;

  @ApiProperty({ enum: IntakeStatus })
  currentStatus!: IntakeStatus;

  @ApiPropertyOptional({ nullable: true })
  note?: string | null;
}
