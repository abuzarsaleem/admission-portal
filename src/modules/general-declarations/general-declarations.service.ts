import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { DeclarationStatus } from '../../common/enums/declaration-status.enum.js';
import { MasterStatus } from '../../common/enums/master-data.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { DeclarationTypeEntity } from '../../database/entities/declaration-type.entity.js';
import { GeneralDeclarationEntity } from '../../database/entities/general-declaration.entity.js';
import type {
  CreateGeneralDeclarationDto,
  GeneralDeclarationListResponseDto,
  GeneralDeclarationResponseDto,
  ListGeneralDeclarationsQueryDto,
  UpdateGeneralDeclarationDto,
} from './dto/general-declaration.dto.js';

@Injectable()
export class GeneralDeclarationsService {
  constructor(
    @InjectRepository(GeneralDeclarationEntity)
    private readonly generalDeclarationsRepo: Repository<GeneralDeclarationEntity>,
    @InjectRepository(DeclarationTypeEntity)
    private readonly declarationTypesRepo: Repository<DeclarationTypeEntity>,
  ) {}

  async create(
    ctx: RequestContext,
    dto: CreateGeneralDeclarationDto,
  ): Promise<GeneralDeclarationResponseDto> {
    await this.assertActiveDeclarationType(dto.declarationTypeId);
    this.assertEffectiveWindow(dto.effectiveFrom, dto.effectiveTo ?? null);
    await this.assertUniqueVersion(
      ctx.tenantId,
      dto.declarationTypeId,
      dto.version,
    );

    const entity = this.generalDeclarationsRepo.create({
      tenantId: ctx.tenantId,
      declarationTypeId: dto.declarationTypeId,
      declarationText: dto.declarationText,
      version: dto.version,
      effectiveFrom: dto.effectiveFrom,
      effectiveTo: dto.effectiveTo ?? null,
      status: dto.status ?? DeclarationStatus.DRAFT,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    return this.toResponse(await this.generalDeclarationsRepo.save(entity));
  }

  async list(
    ctx: RequestContext,
    query: ListGeneralDeclarationsQueryDto,
  ): Promise<GeneralDeclarationListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: {
      tenantId: string;
      status?: DeclarationStatus;
      declarationTypeId?: string;
    } = { tenantId: ctx.tenantId };
    if (query.status) where.status = query.status;
    if (query.declarationTypeId) {
      where.declarationTypeId = query.declarationTypeId;
    }

    const [rows, total] = await this.generalDeclarationsRepo.findAndCount({
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
    generalDeclarationId: string,
  ): Promise<GeneralDeclarationResponseDto> {
    return this.toResponse(
      await this.findTenantGeneralDeclaration(
        ctx.tenantId,
        generalDeclarationId,
      ),
    );
  }

  async update(
    ctx: RequestContext,
    generalDeclarationId: string,
    dto: UpdateGeneralDeclarationDto,
  ): Promise<GeneralDeclarationResponseDto> {
    const entity = await this.findTenantGeneralDeclaration(
      ctx.tenantId,
      generalDeclarationId,
    );

    if (dto.version !== undefined && dto.version !== entity.version) {
      await this.assertUniqueVersion(
        ctx.tenantId,
        entity.declarationTypeId,
        dto.version,
        entity.id,
      );
      entity.version = dto.version;
    }
    if (dto.declarationText !== undefined) {
      entity.declarationText = dto.declarationText;
    }
    if (dto.effectiveFrom !== undefined) {
      entity.effectiveFrom = dto.effectiveFrom;
    }
    if (dto.effectiveTo !== undefined) {
      entity.effectiveTo = dto.effectiveTo;
    }
    if (dto.status !== undefined) entity.status = dto.status;

    this.assertEffectiveWindow(entity.effectiveFrom, entity.effectiveTo);
    entity.updatedBy = ctx.userId;

    return this.toResponse(await this.generalDeclarationsRepo.save(entity));
  }

  async remove(
    ctx: RequestContext,
    generalDeclarationId: string,
  ): Promise<GeneralDeclarationResponseDto> {
    const entity = await this.findTenantGeneralDeclaration(
      ctx.tenantId,
      generalDeclarationId,
    );
    entity.status = DeclarationStatus.INACTIVE;
    entity.updatedBy = ctx.userId;
    return this.toResponse(await this.generalDeclarationsRepo.save(entity));
  }

  async findTenantGeneralDeclaration(
    tenantId: string,
    generalDeclarationId: string,
  ): Promise<GeneralDeclarationEntity> {
    const entity = await this.generalDeclarationsRepo.findOne({
      where: { id: generalDeclarationId, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(
        `General declaration ${generalDeclarationId} was not found`,
      );
    }
    return entity;
  }

  private async assertActiveDeclarationType(
    declarationTypeId: string,
  ): Promise<void> {
    const type = await this.declarationTypesRepo.findOne({
      where: { id: declarationTypeId },
    });
    if (!type) {
      throw new NotFoundException(
        `Declaration type ${declarationTypeId} was not found`,
      );
    }
    if (type.status !== MasterStatus.ACTIVE) {
      throw new ForbiddenException(
        `Declaration type ${declarationTypeId} is not ACTIVE`,
      );
    }
  }

  private async assertUniqueVersion(
    tenantId: string,
    declarationTypeId: string,
    version: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.generalDeclarationsRepo.findOne({
      where: { tenantId, declarationTypeId, version },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `General declaration version '${version}' already exists for this type`,
      );
    }
  }

  private assertEffectiveWindow(
    effectiveFrom: Date,
    effectiveTo: Date | null,
  ): void {
    if (
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
    entity: GeneralDeclarationEntity,
  ): GeneralDeclarationResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      declarationTypeId: String(entity.declarationTypeId),
      declarationText: entity.declarationText,
      version: entity.version,
      effectiveFrom: entity.effectiveFrom.toISOString(),
      effectiveTo: entity.effectiveTo
        ? entity.effectiveTo.toISOString()
        : null,
      status: entity.status as DeclarationStatus,
      createdAt: entity.createdAt.toISOString(),
      createdBy: String(entity.createdBy),
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: String(entity.updatedBy),
    };
  }
}
