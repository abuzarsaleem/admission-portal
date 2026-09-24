import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { DeclarationStatus } from '../../common/enums/declaration-status.enum.js';
import { MasterStatus } from '../../common/enums/master-data.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { DeclarationTypeEntity } from '../../database/entities/declaration-type.entity.js';
import { GeneralDeclarationEntity } from '../../database/entities/general-declaration.entity.js';
import { OfferingDeclarationEntity } from '../../database/entities/offering-declaration.entity.js';
import { ProgrammeOfferingsService } from '../programme-offerings/programme-offerings.service.js';
import type {
  CreateOfferingDeclarationDto,
  CreateOfferingDeclarationItemDto,
  OfferingDeclarationBatchResponseDto,
  OfferingDeclarationResponseDto,
  UpdateOfferingDeclarationDto,
} from './dto/offering-declaration.dto.js';

@Injectable()
export class OfferingDeclarationsService {
  constructor(
    @InjectRepository(OfferingDeclarationEntity)
    private readonly offeringDeclarationsRepo: Repository<OfferingDeclarationEntity>,
    @InjectRepository(GeneralDeclarationEntity)
    private readonly generalDeclarationsRepo: Repository<GeneralDeclarationEntity>,
    @InjectRepository(DeclarationTypeEntity)
    private readonly declarationTypesRepo: Repository<DeclarationTypeEntity>,
    private readonly programmeOfferingsService: ProgrammeOfferingsService,
    private readonly dataSource: DataSource,
  ) {}

  async createForOfferings(
    ctx: RequestContext,
    dto: CreateOfferingDeclarationDto,
  ): Promise<OfferingDeclarationBatchResponseDto> {
    for (const offeringId of dto.offeringIds) {
      await this.programmeOfferingsService.ensureEditableOffering(
        ctx.tenantId,
        offeringId,
      );
    }

    const responses: OfferingDeclarationResponseDto[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.declarations) {
        const resolved = await this.resolveDeclarationFields(manager, ctx, item);
        this.assertEffectiveWindow(
          resolved.effectiveFrom,
          resolved.effectiveTo,
        );

        for (const offeringId of dto.offeringIds) {
          const offeringDeclaration = manager.create(OfferingDeclarationEntity, {
            tenantId: ctx.tenantId,
            programmeOfferingId: offeringId,
            declarationTypeId: resolved.declarationTypeId,
            declarationText: resolved.declarationText,
            version: resolved.version,
            effectiveFrom: resolved.effectiveFrom,
            effectiveTo: resolved.effectiveTo,
            status: item.status ?? DeclarationStatus.ACTIVE,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          });
          const saved = await manager.save(offeringDeclaration);
          responses.push(this.toResponse(saved));
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
  ): Promise<OfferingDeclarationBatchResponseDto> {
    await this.programmeOfferingsService.findTenantOffering(
      ctx.tenantId,
      offeringId,
    );

    const rows = await this.offeringDeclarationsRepo.find({
      where: {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
      },
      order: { createdAt: 'ASC' },
    });

    return { items: rows.map((row) => this.toResponse(row)) };
  }

  async update(
    ctx: RequestContext,
    offeringDeclarationId: string,
    dto: UpdateOfferingDeclarationDto,
  ): Promise<OfferingDeclarationResponseDto> {
    const entity = await this.findTenantOfferingDeclaration(
      ctx.tenantId,
      offeringDeclarationId,
    );
    await this.programmeOfferingsService.ensureEditableOffering(
      ctx.tenantId,
      entity.programmeOfferingId,
    );

    if (dto.declarationText !== undefined) {
      entity.declarationText = dto.declarationText;
    }
    if (dto.version !== undefined) entity.version = dto.version;
    if (dto.effectiveFrom !== undefined) {
      entity.effectiveFrom = dto.effectiveFrom;
    }
    if (dto.effectiveTo !== undefined) entity.effectiveTo = dto.effectiveTo;
    if (dto.status !== undefined) entity.status = dto.status;

    this.assertEffectiveWindow(entity.effectiveFrom, entity.effectiveTo);
    entity.updatedBy = ctx.userId;

    return this.toResponse(await this.offeringDeclarationsRepo.save(entity));
  }

  private async resolveDeclarationFields(
    manager: import('typeorm').EntityManager,
    ctx: RequestContext,
    item: CreateOfferingDeclarationItemDto,
  ): Promise<{
    declarationTypeId: string;
    declarationText: string;
    version: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  }> {
    if (item.generalDeclarationId) {
      const general = await manager.findOne(GeneralDeclarationEntity, {
        where: { id: item.generalDeclarationId, tenantId: ctx.tenantId },
      });
      if (!general) {
        throw new NotFoundException(
          `General declaration ${item.generalDeclarationId} was not found`,
        );
      }
      if (general.status !== DeclarationStatus.ACTIVE) {
        throw new ForbiddenException(
          `General declaration ${item.generalDeclarationId} is not ACTIVE`,
        );
      }
      return {
        declarationTypeId: general.declarationTypeId,
        declarationText: general.declarationText,
        version: general.version,
        effectiveFrom: item.effectiveFrom ?? general.effectiveFrom,
        effectiveTo:
          item.effectiveTo !== undefined
            ? item.effectiveTo
            : general.effectiveTo,
      };
    }

    await this.assertActiveDeclarationType(item.declarationTypeId!);
    return {
      declarationTypeId: item.declarationTypeId!,
      declarationText: item.declarationText!,
      version: item.version!,
      effectiveFrom: item.effectiveFrom!,
      effectiveTo: item.effectiveTo ?? null,
    };
  }

  private async findTenantOfferingDeclaration(
    tenantId: string,
    offeringDeclarationId: string,
  ): Promise<OfferingDeclarationEntity> {
    const entity = await this.offeringDeclarationsRepo.findOne({
      where: { id: offeringDeclarationId, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(
        `Offering declaration ${offeringDeclarationId} was not found`,
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
    entity: OfferingDeclarationEntity,
  ): OfferingDeclarationResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      programmeOfferingId: String(entity.programmeOfferingId),
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
