import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import {
  SupportingInformationStatus,
  SupportingInformationType,
} from '../../common/enums/supporting-information.enum.js';
import { SupportingInformationEntity } from '../../database/entities/supporting-information.entity.js';
import { ProgrammeOfferingsService } from '../programme-offerings/programme-offerings.service.js';
import type {
  CreateSupportingInformationDto,
  SupportingInformationBatchResponseDto,
  SupportingInformationResponseDto,
  UpdateSupportingInformationDto,
} from './dto/supporting-information.dto.js';

@Injectable()
export class SupportingInformationService {
  constructor(
    @InjectRepository(SupportingInformationEntity)
    private readonly supportingInfoRepo: Repository<SupportingInformationEntity>,
    private readonly programmeOfferingsService: ProgrammeOfferingsService,
  ) {}

  async createForOfferings(
    ctx: RequestContext,
    dto: CreateSupportingInformationDto,
  ): Promise<SupportingInformationBatchResponseDto> {
    for (const offeringId of dto.offeringIds) {
      await this.programmeOfferingsService.ensureEditableOffering(
        ctx.tenantId,
        offeringId,
      );
    }

    const responses: SupportingInformationResponseDto[] = [];

    for (const item of dto.items) {
      for (const offeringId of dto.offeringIds) {
        const entity = this.supportingInfoRepo.create({
          tenantId: ctx.tenantId,
          programmeOfferingId: offeringId,
          informationType: item.informationType,
          title: item.title,
          content: item.content,
          referenceUrl: item.referenceUrl ?? null,
          mandatory: item.mandatory ?? false,
          displayOrder: item.displayOrder ?? null,
          status: SupportingInformationStatus.ACTIVE,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        });
        const saved = await this.supportingInfoRepo.save(entity);
        responses.push(this.toResponse(saved));
      }
    }

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
  ): Promise<SupportingInformationBatchResponseDto> {
    await this.programmeOfferingsService.findTenantOffering(
      ctx.tenantId,
      offeringId,
    );

    const rows = await this.supportingInfoRepo.find({
      where: {
        tenantId: ctx.tenantId,
        programmeOfferingId: offeringId,
      },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return { items: rows.map((row) => this.toResponse(row)) };
  }

  async update(
    ctx: RequestContext,
    informationId: string,
    dto: UpdateSupportingInformationDto,
  ): Promise<SupportingInformationResponseDto> {
    const entity = await this.findTenantInfo(ctx.tenantId, informationId);
    await this.programmeOfferingsService.ensureEditableOffering(
      ctx.tenantId,
      entity.programmeOfferingId,
    );

    if (dto.informationType !== undefined) {
      entity.informationType = dto.informationType;
    }
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.content !== undefined) entity.content = dto.content;
    if (dto.referenceUrl !== undefined) entity.referenceUrl = dto.referenceUrl;
    if (dto.mandatory !== undefined) entity.mandatory = dto.mandatory;
    if (dto.displayOrder !== undefined) entity.displayOrder = dto.displayOrder;
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = ctx.userId;

    return this.toResponse(await this.supportingInfoRepo.save(entity));
  }

  private async findTenantInfo(
    tenantId: string,
    informationId: string,
  ): Promise<SupportingInformationEntity> {
    const entity = await this.supportingInfoRepo.findOne({
      where: { id: informationId, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(
        `Supporting information ${informationId} was not found`,
      );
    }
    return entity;
  }

  private toResponse(
    entity: SupportingInformationEntity,
  ): SupportingInformationResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      programmeOfferingId: String(entity.programmeOfferingId),
      informationType: entity.informationType as SupportingInformationType,
      title: entity.title,
      content: entity.content,
      referenceUrl: entity.referenceUrl,
      mandatory: entity.mandatory,
      displayOrder: entity.displayOrder,
      status: entity.status as SupportingInformationStatus,
      createdAt: entity.createdAt.toISOString(),
      createdBy: String(entity.createdBy),
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: String(entity.updatedBy),
    };
  }
}
