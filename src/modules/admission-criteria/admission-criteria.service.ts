import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { CriteriaOperator } from '../../common/enums/criteria-operator.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { CriteriaTypeEntity } from '../../database/entities/criteria-type.entity.js';
import { GeneralCriterionEntity } from '../../database/entities/general-criterion.entity.js';
import { ProgrammeOfferingsService } from '../programme-offerings/programme-offerings.service.js';
import type {
  AdmissionCriterionResponseDto,
  CreateAdmissionCriterionDto,
  UpdateAdmissionCriterionDto,
} from './dto/admission-criterion.dto.js';

@Injectable()
export class AdmissionCriteriaService {
  constructor(
    @InjectRepository(AdmissionCriterionEntity)
    private readonly admissionCriteriaRepo: Repository<AdmissionCriterionEntity>,
    @InjectRepository(GeneralCriterionEntity)
    private readonly generalCriteriaRepo: Repository<GeneralCriterionEntity>,
    @InjectRepository(CriteriaTypeEntity)
    private readonly criteriaTypesRepo: Repository<CriteriaTypeEntity>,
    private readonly programmeOfferingsService: ProgrammeOfferingsService,
    private readonly dataSource: DataSource,
  ) {}

  async createForOffering(
    ctx: RequestContext,
    offeringId: string,
    dto: CreateAdmissionCriterionDto,
  ): Promise<AdmissionCriterionResponseDto> {
    await this.programmeOfferingsService.ensureEditableOffering(
      ctx.tenantId,
      offeringId,
    );
    await this.assertActiveCriteriaType(dto.criteriaTypeId);
    this.assertEffectiveWindow(dto.effectiveFrom ?? null, dto.effectiveTo ?? null);

    const saved = await this.dataSource.transaction(async (manager) => {
      const general = manager.create(GeneralCriterionEntity, {
        tenantId: ctx.tenantId,
        criteriaTypeId: dto.criteriaTypeId,
        criteriaName: dto.criteriaName ?? null,
        criteriaRequirement: dto.criteriaRequirement,
        criteriaOperator: dto.criteriaOperator ?? null,
        criteriaUnit: dto.criteriaUnit ?? null,
        mandatory: dto.mandatory ?? true,
      });
      const savedGeneral = await manager.save(general);

      const criterion = manager.create(AdmissionCriterionEntity, {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
        generalCriteriaId: savedGeneral.id,
        sequenceNo: dto.sequenceNo ?? null,
        effectiveFrom: dto.effectiveFrom ?? null,
        effectiveTo: dto.effectiveTo ?? null,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });
      const savedCriterion = await manager.save(criterion);
      return { criterion: savedCriterion, general: savedGeneral };
    });

    await this.programmeOfferingsService.markConfiguredForSetup(
      ctx.tenantId,
      offeringId,
      ctx.userId,
    );

    return this.toResponse(saved.criterion, saved.general);
  }

  async update(
    ctx: RequestContext,
    criteriaId: string,
    dto: UpdateAdmissionCriterionDto,
  ): Promise<AdmissionCriterionResponseDto> {
    const criterion = await this.findTenantCriterion(ctx.tenantId, criteriaId);
    await this.programmeOfferingsService.ensureEditableOffering(
      ctx.tenantId,
      criterion.programmeOfferingId,
    );

    const general = await this.generalCriteriaRepo.findOne({
      where: { id: criterion.generalCriteriaId, tenantId: ctx.tenantId },
    });
    if (!general) {
      throw new NotFoundException(
        `General criteria ${criterion.generalCriteriaId} was not found`,
      );
    }

    const nextFrom =
      dto.effectiveFrom !== undefined ? dto.effectiveFrom : criterion.effectiveFrom;
    const nextTo =
      dto.effectiveTo !== undefined ? dto.effectiveTo : criterion.effectiveTo;
    this.assertEffectiveWindow(nextFrom, nextTo);

    if (dto.criteriaName !== undefined) general.criteriaName = dto.criteriaName;
    if (dto.criteriaRequirement !== undefined) {
      general.criteriaRequirement = dto.criteriaRequirement;
    }
    if (dto.criteriaOperator !== undefined) {
      general.criteriaOperator = dto.criteriaOperator;
    }
    if (dto.criteriaUnit !== undefined) general.criteriaUnit = dto.criteriaUnit;
    if (dto.mandatory !== undefined) general.mandatory = dto.mandatory;

    if (dto.sequenceNo !== undefined) criterion.sequenceNo = dto.sequenceNo;
    if (dto.effectiveFrom !== undefined) {
      criterion.effectiveFrom = dto.effectiveFrom;
    }
    if (dto.effectiveTo !== undefined) criterion.effectiveTo = dto.effectiveTo;
    criterion.updatedBy = ctx.userId;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(general);
      await manager.save(criterion);
    });

    return this.toResponse(criterion, general);
  }

  private async findTenantCriterion(
    tenantId: string,
    criteriaId: string,
  ): Promise<AdmissionCriterionEntity> {
    const criterion = await this.admissionCriteriaRepo.findOne({
      where: { id: criteriaId, tenantId },
    });
    if (!criterion) {
      throw new NotFoundException(`Admission criterion ${criteriaId} was not found`);
    }
    return criterion;
  }

  private async assertActiveCriteriaType(criteriaTypeId: string): Promise<void> {
    const type = await this.criteriaTypesRepo.findOne({
      where: { id: criteriaTypeId },
    });
    if (!type) {
      throw new NotFoundException(`Criteria type ${criteriaTypeId} was not found`);
    }
    if (type.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Criteria type ${criteriaTypeId} is not ACTIVE`,
      );
    }
  }

  private assertEffectiveWindow(
    effectiveFrom: Date | null,
    effectiveTo: Date | null,
  ): void {
    if (effectiveFrom && effectiveTo && effectiveTo.getTime() <= effectiveFrom.getTime()) {
      throw new BusinessException(
        'effectiveTo must be after effectiveFrom',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'INVALID_EFFECTIVE_WINDOW',
      );
    }
  }

  private toResponse(
    criterion: AdmissionCriterionEntity,
    general: GeneralCriterionEntity,
  ): AdmissionCriterionResponseDto {
    return {
      id: String(criterion.id),
      tenantId: String(criterion.tenantId),
      programmeOfferingId: String(criterion.programmeOfferingId),
      generalCriteriaId: String(criterion.generalCriteriaId),
      criteriaTypeId: String(general.criteriaTypeId),
      criteriaName: general.criteriaName,
      criteriaRequirement: general.criteriaRequirement,
      criteriaOperator: (general.criteriaOperator as CriteriaOperator | null) ?? null,
      criteriaUnit: general.criteriaUnit,
      mandatory: general.mandatory,
      sequenceNo: criterion.sequenceNo,
      effectiveFrom: criterion.effectiveFrom
        ? criterion.effectiveFrom.toISOString()
        : null,
      effectiveTo: criterion.effectiveTo
        ? criterion.effectiveTo.toISOString()
        : null,
      createdAt: criterion.createdAt.toISOString(),
      createdBy: String(criterion.createdBy),
      updatedAt: criterion.updatedAt.toISOString(),
      updatedBy: String(criterion.updatedBy),
    };
  }
}
