import {
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { FeeStatus } from '../../common/enums/fee-status.enum.js';
import { IntakeStatus } from '../../common/enums/intake-status.enum.js';
import { OfferingStatus } from '../../common/enums/offering-status.enum.js';
import { SupportingInformationStatus } from '../../common/enums/supporting-information.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { IntakeEntity } from '../../database/entities/intake.entity.js';
import { OfferingFeeEntity } from '../../database/entities/offering-fee.entity.js';
import { ProgrammeOfferingEntity } from '../../database/entities/programme-offering.entity.js';
import { SupportingInformationEntity } from '../../database/entities/supporting-information.entity.js';
import type {
  IntakeReviewOfferingDto,
  IntakeReviewPackageDto,
  IntakeWorkflowResponseDto,
  PublicationReadinessDto,
  PublicationReadinessIssueDto,
  ReturnIntakeDto,
} from './dto/intake-workflow.dto.js';
import { IntakesService } from './intakes.service.js';

@Injectable()
export class IntakeWorkflowService {
  constructor(
    @InjectRepository(IntakeEntity)
    private readonly intakesRepo: Repository<IntakeEntity>,
    @InjectRepository(ProgrammeOfferingEntity)
    private readonly offeringsRepo: Repository<ProgrammeOfferingEntity>,
    @InjectRepository(AdmissionCriterionEntity)
    private readonly criteriaRepo: Repository<AdmissionCriterionEntity>,
    @InjectRepository(OfferingFeeEntity)
    private readonly offeringFeesRepo: Repository<OfferingFeeEntity>,
    @InjectRepository(SupportingInformationEntity)
    private readonly supportingInfoRepo: Repository<SupportingInformationEntity>,
    private readonly intakesService: IntakesService,
    private readonly dataSource: DataSource,
  ) {}

  async getReviewPackage(
    ctx: RequestContext,
    intakeId: string,
  ): Promise<IntakeReviewPackageDto> {
    const intake = await this.intakesService.findTenantIntake(
      ctx.tenantId,
      intakeId,
    );
    const offerings = await this.offeringsRepo.find({
      where: { tenantId: ctx.tenantId, intakeId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    const offeringSummaries: IntakeReviewOfferingDto[] = [];
    for (const offering of offerings) {
      const [
        criteriaCount,
        activeFeeCount,
        supportingInformationCount,
        mandatoryRequired,
        mandatoryActive,
      ] = await Promise.all([
        this.criteriaRepo.count({
          where: {
            tenantId: ctx.tenantId,
            programmeOfferingId: offering.id,
          },
        }),
        this.offeringFeesRepo.count({
          where: {
            tenantId: ctx.tenantId,
            programmeOfferingId: offering.id,
            status: FeeStatus.ACTIVE,
          },
        }),
        this.supportingInfoRepo.count({
          where: {
            tenantId: ctx.tenantId,
            programmeOfferingId: offering.id,
            status: SupportingInformationStatus.ACTIVE,
          },
        }),
        this.supportingInfoRepo.count({
          where: {
            tenantId: ctx.tenantId,
            programmeOfferingId: offering.id,
            mandatory: true,
          },
        }),
        this.supportingInfoRepo.count({
          where: {
            tenantId: ctx.tenantId,
            programmeOfferingId: offering.id,
            mandatory: true,
            status: SupportingInformationStatus.ACTIVE,
          },
        }),
      ]);

      offeringSummaries.push({
        offeringId: String(offering.id),
        programmeId: String(offering.programmeId),
        offeringStatus: offering.offeringStatus,
        publishedDescription: offering.publishedDescription,
        criteriaCount,
        activeFeeCount,
        supportingInformationCount,
        missingMandatorySupportingInfo: Math.max(
          0,
          mandatoryRequired - mandatoryActive,
        ),
      });
    }

    return {
      intake: this.intakesService.toResponse(intake),
      readiness: await this.evaluateReadiness(ctx.tenantId, intakeId, offerings),
      offerings: offeringSummaries,
    };
  }

  async submitForReview(
    ctx: RequestContext,
    intakeId: string,
  ): Promise<IntakeWorkflowResponseDto> {
    const intake = await this.intakesService.findTenantIntake(
      ctx.tenantId,
      intakeId,
    );
    this.assertStatusIn(intake, [
      IntakeStatus.DRAFT,
      IntakeStatus.CONFIGURED,
    ]);

    const readiness = await this.evaluateReadiness(ctx.tenantId, intakeId);
    if (!readiness.ready) {
      throw new BusinessException(
        `Intake is not ready for review: ${readiness.issues.map((i) => i.message).join('; ')}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PUBLICATION_READINESS_FAILED',
      );
    }

    const previous = intake.status as IntakeStatus;
    await this.dataSource.transaction(async (manager) => {
      intake.status = IntakeStatus.UNDER_REVIEW;
      intake.updatedBy = ctx.userId;
      await manager.save(intake);
      await manager.update(
        ProgrammeOfferingEntity,
        { tenantId: ctx.tenantId, intakeId },
        {
          offeringStatus: OfferingStatus.UNDER_REVIEW,
          updatedBy: ctx.userId,
        },
      );
    });

    return {
      intake: this.intakesService.toResponse(intake),
      previousStatus: previous,
      currentStatus: IntakeStatus.UNDER_REVIEW,
      note: null,
    };
  }

  async publish(
    ctx: RequestContext,
    intakeId: string,
  ): Promise<IntakeWorkflowResponseDto> {
    const intake = await this.intakesService.findTenantIntake(
      ctx.tenantId,
      intakeId,
    );
    this.assertStatusIn(intake, [IntakeStatus.UNDER_REVIEW]);

    const readiness = await this.evaluateReadiness(ctx.tenantId, intakeId);
    if (!readiness.ready) {
      throw new BusinessException(
        `Intake is not ready to publish: ${readiness.issues.map((i) => i.message).join('; ')}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PUBLICATION_READINESS_FAILED',
      );
    }

    const previous = intake.status as IntakeStatus;
    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      intake.status = IntakeStatus.PUBLISHED;
      intake.publishedAt = now;
      intake.publishedBy = ctx.userId;
      intake.updatedBy = ctx.userId;
      await manager.save(intake);

      await manager.update(
        ProgrammeOfferingEntity,
        { tenantId: ctx.tenantId, intakeId },
        {
          offeringStatus: OfferingStatus.PUBLISHED,
          publishedAt: now,
          updatedBy: ctx.userId,
        },
      );
    });

    return {
      intake: this.intakesService.toResponse(intake),
      previousStatus: previous,
      currentStatus: IntakeStatus.PUBLISHED,
      note: null,
    };
  }

  async returnForCorrection(
    ctx: RequestContext,
    intakeId: string,
    dto: ReturnIntakeDto,
  ): Promise<IntakeWorkflowResponseDto> {
    const intake = await this.intakesService.findTenantIntake(
      ctx.tenantId,
      intakeId,
    );
    this.assertStatusIn(intake, [IntakeStatus.UNDER_REVIEW]);
    const previous = intake.status as IntakeStatus;

    await this.dataSource.transaction(async (manager) => {
      intake.status = IntakeStatus.CONFIGURED;
      intake.updatedBy = ctx.userId;
      await manager.save(intake);
      await manager.update(
        ProgrammeOfferingEntity,
        { tenantId: ctx.tenantId, intakeId },
        {
          offeringStatus: OfferingStatus.CONFIGURED,
          updatedBy: ctx.userId,
        },
      );
    });

    return {
      intake: this.intakesService.toResponse(intake),
      previousStatus: previous,
      currentStatus: IntakeStatus.CONFIGURED,
      note: dto.reason ?? null,
    };
  }

  async close(
    ctx: RequestContext,
    intakeId: string,
  ): Promise<IntakeWorkflowResponseDto> {
    const intake = await this.intakesService.findTenantIntake(
      ctx.tenantId,
      intakeId,
    );
    this.assertStatusIn(intake, [IntakeStatus.PUBLISHED]);

    const previous = intake.status as IntakeStatus;
    await this.dataSource.transaction(async (manager) => {
      intake.status = IntakeStatus.CLOSED;
      intake.updatedBy = ctx.userId;
      await manager.save(intake);
      await manager.update(
        ProgrammeOfferingEntity,
        { tenantId: ctx.tenantId, intakeId },
        {
          offeringStatus: OfferingStatus.CLOSED,
          updatedBy: ctx.userId,
        },
      );
    });

    return {
      intake: this.intakesService.toResponse(intake),
      previousStatus: previous,
      currentStatus: IntakeStatus.CLOSED,
      note: null,
    };
  }

  private async evaluateReadiness(
    tenantId: string,
    intakeId: string,
    offerings?: ProgrammeOfferingEntity[],
  ): Promise<PublicationReadinessDto> {
    const issues: PublicationReadinessIssueDto[] = [];
    const list =
      offerings ??
      (await this.offeringsRepo.find({
        where: { tenantId, intakeId },
      }));

    if (list.length === 0) {
      issues.push({
        code: 'NO_OFFERINGS',
        message: 'Intake must have at least one programme offering',
        offeringId: null,
      });
      return { ready: false, issues };
    }

    for (const offering of list) {
      const criteriaCount = await this.criteriaRepo.count({
        where: { tenantId, programmeOfferingId: offering.id },
      });
      if (criteriaCount === 0) {
        issues.push({
          code: 'MISSING_CRITERIA',
          message: 'Offering has no admission criteria',
          offeringId: String(offering.id),
        });
      }

      const feeCount = await this.offeringFeesRepo.count({
        where: {
          tenantId,
          programmeOfferingId: offering.id,
          status: FeeStatus.ACTIVE,
        },
      });
      if (feeCount === 0) {
        issues.push({
          code: 'MISSING_OFFERING_FEE',
          message: 'Offering has no ACTIVE fee configuration',
          offeringId: String(offering.id),
        });
      }

      const mandatoryRequired = await this.supportingInfoRepo.count({
        where: {
          tenantId,
          programmeOfferingId: offering.id,
          mandatory: true,
        },
      });
      const mandatoryActive = await this.supportingInfoRepo.count({
        where: {
          tenantId,
          programmeOfferingId: offering.id,
          mandatory: true,
          status: SupportingInformationStatus.ACTIVE,
        },
      });
      if (mandatoryRequired > 0 && mandatoryActive < mandatoryRequired) {
        issues.push({
          code: 'MISSING_MANDATORY_SUPPORTING_INFORMATION',
          message:
            'Mandatory supporting information is incomplete or inactive',
          offeringId: String(offering.id),
        });
      }
    }

    return { ready: issues.length === 0, issues };
  }

  private assertStatusIn(intake: IntakeEntity, allowed: IntakeStatus[]): void {
    if (!allowed.includes(intake.status as IntakeStatus)) {
      throw new ForbiddenException(
        `Intake in status ${intake.status} cannot perform this action (allowed: ${allowed.join(', ')})`,
      );
    }
  }
}
