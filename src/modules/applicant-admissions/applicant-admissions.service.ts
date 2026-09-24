import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { FeeStatus } from '../../common/enums/fee-status.enum.js';
import { DeclarationStatus } from '../../common/enums/declaration-status.enum.js';
import { IntakeStatus } from '../../common/enums/intake-status.enum.js';
import { OfferingStatus } from '../../common/enums/offering-status.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { GeneralCriterionEntity } from '../../database/entities/general-criterion.entity.js';
import { GeneralFeeEntity } from '../../database/entities/general-fee.entity.js';
import { IntakeEntity } from '../../database/entities/intake.entity.js';
import { OfferingDeclarationEntity } from '../../database/entities/offering-declaration.entity.js';
import { OfferingFeeEntity } from '../../database/entities/offering-fee.entity.js';
import { ProgrammeOfferingEntity } from '../../database/entities/programme-offering.entity.js';
import { ProgrammeEntity } from '../../database/entities/programme.entity.js';
import type {
  ApplicantCriterionDto,
  ApplicantDeclarationDto,
  ApplicantFeeDto,
  ApplicantIntakeDto,
  ApplicantIntakeListDto,
  ApplicantListQueryDto,
  ApplicantOfferingDto,
  ApplicantOfferingListDto,
  StartApplicationResponseDto,
} from './dto/applicant-admissions.dto.js';

@Injectable()
export class ApplicantAdmissionsService {
  constructor(
    @InjectRepository(IntakeEntity)
    private readonly intakesRepo: Repository<IntakeEntity>,
    @InjectRepository(ProgrammeOfferingEntity)
    private readonly offeringsRepo: Repository<ProgrammeOfferingEntity>,
    @InjectRepository(ProgrammeEntity)
    private readonly programmesRepo: Repository<ProgrammeEntity>,
    @InjectRepository(AdmissionCriterionEntity)
    private readonly criteriaRepo: Repository<AdmissionCriterionEntity>,
    @InjectRepository(GeneralCriterionEntity)
    private readonly generalCriteriaRepo: Repository<GeneralCriterionEntity>,
    @InjectRepository(OfferingFeeEntity)
    private readonly offeringFeesRepo: Repository<OfferingFeeEntity>,
    @InjectRepository(GeneralFeeEntity)
    private readonly generalFeesRepo: Repository<GeneralFeeEntity>,
    @InjectRepository(OfferingDeclarationEntity)
    private readonly offeringDeclarationsRepo: Repository<OfferingDeclarationEntity>,
  ) {}

  async listIntakes(
    ctx: RequestContext,
    query: ApplicantListQueryDto,
  ): Promise<ApplicantIntakeListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const now = new Date();

    const [rows, total] = await this.intakesRepo.findAndCount({
      where: {
        tenantId: ctx.tenantId,
        status: IntakeStatus.PUBLISHED,
        applicationCloseAt: MoreThanOrEqual(now),
      },
      order: { applicationOpenAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: rows.map((row) => this.toIntake(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getIntake(
    ctx: RequestContext,
    intakeId: string,
  ): Promise<ApplicantIntakeDto> {
    const intake = await this.findVisibleIntake(ctx.tenantId, intakeId);
    return this.toIntake(intake);
  }

  async listProgrammes(
    ctx: RequestContext,
    intakeId: string,
    query: ApplicantListQueryDto,
  ): Promise<ApplicantOfferingListDto> {
    await this.findVisibleIntake(ctx.tenantId, intakeId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.offeringsRepo.findAndCount({
      where: {
        tenantId: ctx.tenantId,
        intakeId,
        offeringStatus: OfferingStatus.PUBLISHED,
      },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: ApplicantOfferingDto[] = [];
    for (const offering of rows) {
      items.push(await this.toOffering(ctx.tenantId, offering));
    }

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getOffering(
    ctx: RequestContext,
    offeringId: string,
  ): Promise<ApplicantOfferingDto> {
    const offering = await this.findVisibleOffering(ctx.tenantId, offeringId);
    return this.toOffering(ctx.tenantId, offering);
  }

  async getCriteria(
    ctx: RequestContext,
    offeringId: string,
  ): Promise<ApplicantCriterionDto[]> {
    await this.findVisibleOffering(ctx.tenantId, offeringId);
    const now = new Date();

    const criteria = await this.criteriaRepo.find({
      where: {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
      },
      order: { sequenceNo: 'ASC', createdAt: 'ASC' },
    });

    const result: ApplicantCriterionDto[] = [];
    for (const criterion of criteria) {
      if (!this.isCurrentlyEffective(criterion.effectiveFrom, criterion.effectiveTo, now)) {
        continue;
      }
      const general = await this.generalCriteriaRepo.findOne({
        where: { id: criterion.generalCriteriaId, tenantId: ctx.tenantId },
      });
      if (!general) continue;

      result.push({
        id: String(criterion.id),
        criteriaTypeId: String(general.criteriaTypeId),
        criteriaName: general.criteriaName,
        criteriaRequirement: general.criteriaRequirement,
        criteriaOperator: general.criteriaOperator,
        criteriaUnit: general.criteriaUnit,
        criteriaValue:
          general.criteriaValue != null ? Number(general.criteriaValue) : null,
        criteriaValueMax:
          general.criteriaValueMax != null
            ? Number(general.criteriaValueMax)
            : null,
        appliesToDegreeType: general.appliesToDegreeType,
        mandatory: general.mandatory,
        sequenceNo: criterion.sequenceNo,
      });
    }
    return result;
  }

  async getFees(
    ctx: RequestContext,
    offeringId: string,
  ): Promise<ApplicantFeeDto[]> {
    await this.findVisibleOffering(ctx.tenantId, offeringId);
    const now = new Date();

    const fees = await this.offeringFeesRepo.find({
      where: {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
        status: FeeStatus.ACTIVE,
      },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const result: ApplicantFeeDto[] = [];
    for (const fee of fees) {
      if (!this.isCurrentlyEffective(fee.effectiveFrom, fee.effectiveTo, now)) {
        continue;
      }
      const general = await this.generalFeesRepo.findOne({
        where: { id: fee.generalFeeId, tenantId: ctx.tenantId },
      });
      if (!general || general.status !== FeeStatus.ACTIVE) continue;

      result.push({
        id: String(fee.id),
        feeType: general.feeType,
        amount: general.amount,
        currency: general.currency,
        effectiveFrom: fee.effectiveFrom ? fee.effectiveFrom.toISOString() : null,
        effectiveTo: fee.effectiveTo ? fee.effectiveTo.toISOString() : null,
        sortOrder: fee.sortOrder,
      });
    }
    return result;
  }

  async getDeclarations(
    ctx: RequestContext,
    offeringId: string,
  ): Promise<ApplicantDeclarationDto[]> {
    await this.findVisibleOffering(ctx.tenantId, offeringId);
    const now = new Date();

    const rows = await this.offeringDeclarationsRepo.find({
      where: {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
        status: DeclarationStatus.ACTIVE,
      },
      order: { createdAt: 'ASC' },
    });

    return rows
      .filter((row) =>
        this.isCurrentlyEffective(row.effectiveFrom, row.effectiveTo, now),
      )
      .map((row) => ({
        id: String(row.id),
        programmeOfferingId: String(row.programmeOfferingId),
        declarationTypeId: String(row.declarationTypeId),
        declarationText: row.declarationText,
        version: row.version,
        effectiveFrom: row.effectiveFrom.toISOString(),
        effectiveTo: row.effectiveTo ? row.effectiveTo.toISOString() : null,
      }));
  }

  async startApplication(
    ctx: RequestContext,
    offeringId: string,
  ): Promise<StartApplicationResponseDto> {
    const offering = await this.findVisibleOffering(ctx.tenantId, offeringId);
    const intake = await this.findVisibleIntake(ctx.tenantId, offering.intakeId);
    const now = new Date();

    if (
      now.getTime() < intake.applicationOpenAt.getTime() ||
      now.getTime() > intake.applicationCloseAt.getTime()
    ) {
      throw new BusinessException(
        'Application window is not currently open for this intake',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'APPLICATION_WINDOW_CLOSED',
      );
    }

    return {
      targetFeature: 'ADM-F001',
      offeringId: String(offering.id),
      intakeId: String(offering.intakeId),
      programmeId: String(offering.programmeId),
      handoff: {
        tenantId: ctx.tenantId,
        intakeId: String(offering.intakeId),
        offeringId: String(offering.id),
        programmeId: String(offering.programmeId),
        applicantUserId: ctx.userId,
      },
      nextAction: '/api/v1/applications/start',
    };
  }

  private async findVisibleIntake(
    tenantId: string,
    intakeId: string,
  ): Promise<IntakeEntity> {
    const intake = await this.intakesRepo.findOne({
      where: { id: intakeId, tenantId },
    });
    if (!intake || intake.status !== IntakeStatus.PUBLISHED) {
      throw new NotFoundException(`Published intake ${intakeId} was not found`);
    }
    if (intake.applicationCloseAt.getTime() < Date.now()) {
      throw new ForbiddenException(
        `Intake ${intakeId} is no longer valid for applicants`,
      );
    }
    return intake;
  }

  private async findVisibleOffering(
    tenantId: string,
    offeringId: string,
  ): Promise<ProgrammeOfferingEntity> {
    const offering = await this.offeringsRepo.findOne({
      where: { id: offeringId, tenantId },
    });
    if (!offering || offering.offeringStatus !== OfferingStatus.PUBLISHED) {
      throw new NotFoundException(
        `Published offering ${offeringId} was not found`,
      );
    }
    await this.findVisibleIntake(tenantId, offering.intakeId);
    return offering;
  }

  private async toOffering(
    tenantId: string,
    offering: ProgrammeOfferingEntity,
  ): Promise<ApplicantOfferingDto> {
    const programme = await this.programmesRepo.findOne({
      where: { id: offering.programmeId, tenantId },
    });
    if (!programme) {
      throw new NotFoundException(
        `Programme ${offering.programmeId} was not found`,
      );
    }

    return {
      id: String(offering.id),
      intakeId: String(offering.intakeId),
      programmeId: String(offering.programmeId),
      programme: {
        id: String(programme.id),
        code: programme.code,
        name: programme.name,
        degreeLevel: programme.degreeLevel,
        programmeGrouping: programme.programmeGrouping,
      },
      publishedDescription: offering.publishedDescription,
      displayOrder: offering.displayOrder,
      publishedAt: offering.publishedAt
        ? offering.publishedAt.toISOString()
        : null,
    };
  }

  private toIntake(entity: IntakeEntity): ApplicantIntakeDto {
    return {
      id: String(entity.id),
      intakeName: entity.intakeName,
      intakeCode: entity.intakeCode,
      applicationOpenAt: entity.applicationOpenAt.toISOString(),
      applicationCloseAt: entity.applicationCloseAt.toISOString(),
      publishedAt: entity.publishedAt ? entity.publishedAt.toISOString() : null,
    };
  }

  private isCurrentlyEffective(
    from: Date | null,
    to: Date | null,
    now: Date,
  ): boolean {
    if (from && from.getTime() > now.getTime()) return false;
    if (to && to.getTime() < now.getTime()) return false;
    return true;
  }
}
