import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { FeeStatus } from '../../common/enums/fee-status.enum.js';
import { FeeTypeEntity } from '../../database/entities/fee-type.entity.js';
import { GeneralFeeEntity } from '../../database/entities/general-fee.entity.js';
import type {
  CreateGeneralFeeDto,
  GeneralFeeListResponseDto,
  GeneralFeeResponseDto,
  ListGeneralFeesQueryDto,
  UpdateGeneralFeeDto,
} from './dto/general-fee.dto.js';

@Injectable()
export class ProgrammeFeesService {
  constructor(
    @InjectRepository(GeneralFeeEntity)
    private readonly generalFeesRepo: Repository<GeneralFeeEntity>,
    @InjectRepository(FeeTypeEntity)
    private readonly feeTypesRepo: Repository<FeeTypeEntity>,
  ) {}

  async create(
    ctx: RequestContext,
    dto: CreateGeneralFeeDto,
  ): Promise<GeneralFeeResponseDto> {
    await this.assertKnownFeeType(dto.feeType);

    const entity = this.generalFeesRepo.create({
      tenantId: ctx.tenantId,
      feeType: dto.feeType,
      amount: dto.amount.toFixed(2),
      currency: dto.currency,
      status: FeeStatus.ACTIVE,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    return this.toResponse(await this.generalFeesRepo.save(entity));
  }

  async list(
    ctx: RequestContext,
    query: ListGeneralFeesQueryDto,
  ): Promise<GeneralFeeListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: {
      tenantId: string;
      status?: FeeStatus;
      feeType?: string;
    } = { tenantId: ctx.tenantId };
    if (query.status) where.status = query.status;
    if (query.feeType) where.feeType = query.feeType;

    const [rows, total] = await this.generalFeesRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: rows.map((row) => this.toResponse(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getById(
    ctx: RequestContext,
    generalFeeId: string,
  ): Promise<GeneralFeeResponseDto> {
    return this.toResponse(
      await this.findTenantGeneralFee(ctx.tenantId, generalFeeId),
    );
  }

  async update(
    ctx: RequestContext,
    generalFeeId: string,
    dto: UpdateGeneralFeeDto,
  ): Promise<GeneralFeeResponseDto> {
    const entity = await this.findTenantGeneralFee(ctx.tenantId, generalFeeId);

    if (dto.amount !== undefined) entity.amount = dto.amount.toFixed(2);
    if (dto.currency !== undefined) entity.currency = dto.currency;
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = ctx.userId;

    return this.toResponse(await this.generalFeesRepo.save(entity));
  }

  async remove(
    ctx: RequestContext,
    generalFeeId: string,
  ): Promise<GeneralFeeResponseDto> {
    const entity = await this.findTenantGeneralFee(ctx.tenantId, generalFeeId);
    entity.status = FeeStatus.INACTIVE;
    entity.updatedBy = ctx.userId;
    return this.toResponse(await this.generalFeesRepo.save(entity));
  }

  async findTenantGeneralFee(
    tenantId: string,
    generalFeeId: string,
  ): Promise<GeneralFeeEntity> {
    const entity = await this.generalFeesRepo.findOne({
      where: { id: generalFeeId, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(`General fee ${generalFeeId} was not found`);
    }
    return entity;
  }

  private async assertKnownFeeType(feeType: string): Promise<void> {
    const type = await this.feeTypesRepo.findOne({ where: { name: feeType } });
    if (!type) {
      throw new NotFoundException(
        `Fee type '${feeType}' was not found in fee_types catalogue`,
      );
    }
  }

  private toResponse(entity: GeneralFeeEntity): GeneralFeeResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      feeType: entity.feeType,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status as FeeStatus,
      createdAt: entity.createdAt.toISOString(),
      createdBy: String(entity.createdBy),
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: String(entity.updatedBy),
    };
  }
}
