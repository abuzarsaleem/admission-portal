import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { FeeStatus } from '../../common/enums/fee-status.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { FeeTypeEntity } from '../../database/entities/fee-type.entity.js';
import { GeneralFeeEntity } from '../../database/entities/general-fee.entity.js';
import { OfferingFeeEntity } from '../../database/entities/offering-fee.entity.js';
import { ProgrammeOfferingsService } from '../programme-offerings/programme-offerings.service.js';
import type {
  CreateOfferingFeeDto,
  CreateOfferingFeeItemDto,
  OfferingFeeBatchResponseDto,
  OfferingFeeResponseDto,
  UpdateOfferingFeeDto,
} from './dto/offering-fee.dto.js';

@Injectable()
export class OfferingFeesService {
  constructor(
    @InjectRepository(OfferingFeeEntity)
    private readonly offeringFeesRepo: Repository<OfferingFeeEntity>,
    @InjectRepository(GeneralFeeEntity)
    private readonly generalFeesRepo: Repository<GeneralFeeEntity>,
    @InjectRepository(FeeTypeEntity)
    private readonly feeTypesRepo: Repository<FeeTypeEntity>,
    private readonly programmeOfferingsService: ProgrammeOfferingsService,
    private readonly dataSource: DataSource,
  ) {}

  async createForOfferings(
    ctx: RequestContext,
    dto: CreateOfferingFeeDto,
  ): Promise<OfferingFeeBatchResponseDto> {
    for (const item of dto.fees) {
      this.assertEffectiveWindow(
        item.effectiveFrom ?? null,
        item.effectiveTo ?? null,
      );
    }

    for (const offeringId of dto.offeringIds) {
      await this.programmeOfferingsService.ensureEditableOffering(
        ctx.tenantId,
        offeringId,
      );
    }

    const responses: OfferingFeeResponseDto[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.fees) {
        const generalFee = await this.resolveGeneralFee(manager, ctx, item);

        for (const offeringId of dto.offeringIds) {
          const offeringFee = manager.create(OfferingFeeEntity, {
            tenantId: ctx.tenantId,
            programmeOfferingId: offeringId,
            generalFeeId: generalFee.id,
            effectiveFrom: item.effectiveFrom ?? null,
            effectiveTo: item.effectiveTo ?? null,
            status: FeeStatus.ACTIVE,
            sortOrder: item.sortOrder ?? null,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          });
          const saved = await manager.save(offeringFee);
          responses.push(this.toResponse(saved, generalFee));
        }
      }
    });

    for (const offeringId of dto.offeringIds) {
      await this.programmeOfferingsService.markConfiguredForSetup(
        ctx.tenantId,
        offeringId,
        ctx.userId,
      );
    }

    return { items: responses };
  }

  async listByOffering(
    ctx: RequestContext,
    offeringId: string,
  ): Promise<OfferingFeeBatchResponseDto> {
    await this.programmeOfferingsService.findTenantOffering(
      ctx.tenantId,
      offeringId,
    );

    const fees = await this.offeringFeesRepo.find({
      where: {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
      },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const items: OfferingFeeResponseDto[] = [];
    for (const fee of fees) {
      const generalFee = await this.generalFeesRepo.findOne({
        where: { id: fee.generalFeeId, tenantId: ctx.tenantId },
      });
      if (!generalFee) {
        throw new NotFoundException(
          `General fee ${fee.generalFeeId} was not found`,
        );
      }
      items.push(this.toResponse(fee, generalFee));
    }

    return { items };
  }

  private async resolveGeneralFee(
    manager: import('typeorm').EntityManager,
    ctx: RequestContext,
    item: CreateOfferingFeeItemDto,
  ): Promise<GeneralFeeEntity> {
    if (item.generalFeeId) {
      const existing = await manager.findOne(GeneralFeeEntity, {
        where: { id: item.generalFeeId, tenantId: ctx.tenantId },
      });
      if (!existing) {
        throw new NotFoundException(
          `General fee ${item.generalFeeId} was not found`,
        );
      }
      if (existing.status !== FeeStatus.ACTIVE) {
        throw new ForbiddenException(
          `General fee ${item.generalFeeId} is not ACTIVE`,
        );
      }
      return existing;
    }

    await this.assertKnownFeeType(item.feeType!);
    const generalFee = manager.create(GeneralFeeEntity, {
      tenantId: ctx.tenantId,
      feeType: item.feeType!,
      amount: item.amount!.toFixed(2),
      currency: item.currency!,
      status: FeeStatus.ACTIVE,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });
    return manager.save(generalFee);
  }

  async update(
    ctx: RequestContext,
    feeConfigurationId: string,
    dto: UpdateOfferingFeeDto,
  ): Promise<OfferingFeeResponseDto> {
    const offeringFee = await this.findTenantOfferingFee(
      ctx.tenantId,
      feeConfigurationId,
    );
    await this.programmeOfferingsService.ensureEditableOffering(
      ctx.tenantId,
      offeringFee.programmeOfferingId,
    );

    const generalFee = await this.generalFeesRepo.findOne({
      where: { id: offeringFee.generalFeeId, tenantId: ctx.tenantId },
    });
    if (!generalFee) {
      throw new NotFoundException(
        `General fee ${offeringFee.generalFeeId} was not found`,
      );
    }

    const nextFrom =
      dto.effectiveFrom !== undefined
        ? dto.effectiveFrom
        : offeringFee.effectiveFrom;
    const nextTo =
      dto.effectiveTo !== undefined ? dto.effectiveTo : offeringFee.effectiveTo;
    this.assertEffectiveWindow(nextFrom, nextTo);

    if (dto.amount !== undefined) generalFee.amount = dto.amount.toFixed(2);
    if (dto.currency !== undefined) generalFee.currency = dto.currency;
    if (dto.status !== undefined) {
      offeringFee.status = dto.status;
      generalFee.status = dto.status;
    }
    generalFee.updatedBy = ctx.userId;

    if (dto.effectiveFrom !== undefined) {
      offeringFee.effectiveFrom = dto.effectiveFrom;
    }
    if (dto.effectiveTo !== undefined) offeringFee.effectiveTo = dto.effectiveTo;
    if (dto.sortOrder !== undefined) offeringFee.sortOrder = dto.sortOrder;
    offeringFee.updatedBy = ctx.userId;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(generalFee);
      await manager.save(offeringFee);
    });

    return this.toResponse(offeringFee, generalFee);
  }

  private async findTenantOfferingFee(
    tenantId: string,
    feeConfigurationId: string,
  ): Promise<OfferingFeeEntity> {
    const fee = await this.offeringFeesRepo.findOne({
      where: { id: feeConfigurationId, tenantId },
    });
    if (!fee) {
      throw new NotFoundException(
        `Fee configuration ${feeConfigurationId} was not found`,
      );
    }
    return fee;
  }

  private async assertKnownFeeType(feeType: string): Promise<void> {
    const type = await this.feeTypesRepo.findOne({ where: { name: feeType } });
    if (!type) {
      throw new NotFoundException(
        `Fee type '${feeType}' was not found in fee_types catalogue`,
      );
    }
  }

  private assertEffectiveWindow(
    effectiveFrom: Date | null,
    effectiveTo: Date | null,
  ): void {
    if (
      effectiveFrom &&
      effectiveTo &&
      effectiveTo.getTime() <= effectiveFrom.getTime()
    ) {
      throw new BusinessException(
        'effectiveTo must be after effectiveFrom',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'INVALID_EFFECTIVE_WINDOW',
      );
    }
  }

  private toResponse(
    offeringFee: OfferingFeeEntity,
    generalFee: GeneralFeeEntity,
  ): OfferingFeeResponseDto {
    return {
      id: String(offeringFee.id),
      tenantId: String(offeringFee.tenantId),
      programmeOfferingId: String(offeringFee.programmeOfferingId),
      generalFeeId: String(offeringFee.generalFeeId),
      feeType: generalFee.feeType,
      amount: generalFee.amount,
      currency: generalFee.currency,
      status: offeringFee.status as FeeStatus,
      effectiveFrom: offeringFee.effectiveFrom
        ? offeringFee.effectiveFrom.toISOString()
        : null,
      effectiveTo: offeringFee.effectiveTo
        ? offeringFee.effectiveTo.toISOString()
        : null,
      sortOrder: offeringFee.sortOrder,
      createdAt: offeringFee.createdAt.toISOString(),
      createdBy: String(offeringFee.createdBy),
      updatedAt: offeringFee.updatedAt.toISOString(),
      updatedBy: String(offeringFee.updatedBy),
    };
  }
}
