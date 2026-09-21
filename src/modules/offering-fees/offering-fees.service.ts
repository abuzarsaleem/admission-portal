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

  async createForOffering(
    ctx: RequestContext,
    offeringId: string,
    dto: CreateOfferingFeeDto,
  ): Promise<OfferingFeeResponseDto> {
    await this.programmeOfferingsService.ensureEditableOffering(
      ctx.tenantId,
      offeringId,
    );
    this.assertEffectiveWindow(dto.effectiveFrom ?? null, dto.effectiveTo ?? null);

    const result = await this.dataSource.transaction(async (manager) => {
      let generalFee: GeneralFeeEntity;

      if (dto.generalFeeId) {
        const existing = await manager.findOne(GeneralFeeEntity, {
          where: { id: dto.generalFeeId, tenantId: ctx.tenantId },
        });
        if (!existing) {
          throw new NotFoundException(
            `General fee ${dto.generalFeeId} was not found`,
          );
        }
        if (existing.status !== FeeStatus.ACTIVE) {
          throw new ForbiddenException(
            `General fee ${dto.generalFeeId} is not ACTIVE`,
          );
        }
        generalFee = existing;
      } else {
        await this.assertKnownFeeType(dto.feeType!);
        generalFee = manager.create(GeneralFeeEntity, {
          tenantId: ctx.tenantId,
          feeType: dto.feeType!,
          amount: dto.amount!.toFixed(2),
          currency: dto.currency!,
          status: FeeStatus.ACTIVE,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        });
        generalFee = await manager.save(generalFee);
      }

      const offeringFee = manager.create(OfferingFeeEntity, {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
        generalFeeId: generalFee.id,
        effectiveFrom: dto.effectiveFrom ?? null,
        effectiveTo: dto.effectiveTo ?? null,
        status: FeeStatus.ACTIVE,
        sortOrder: dto.sortOrder ?? null,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });
      const savedOfferingFee = await manager.save(offeringFee);
      return { offeringFee: savedOfferingFee, generalFee };
    });

    await this.programmeOfferingsService.markConfiguredForSetup(
      ctx.tenantId,
      offeringId,
      ctx.userId,
    );

    return this.toResponse(result.offeringFee, result.generalFee);
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
