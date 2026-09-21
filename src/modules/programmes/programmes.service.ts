import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import {
  DegreeLevel,
  MasterStatus,
} from '../../common/enums/master-data.enum.js';
import { ProgrammeEntity } from '../../database/entities/programme.entity.js';
import { DepartmentsService } from '../departments/departments.service.js';
import type {
  CreateProgrammeDto,
  ListProgrammesQueryDto,
  ProgrammeListResponseDto,
  ProgrammeResponseDto,
  UpdateProgrammeDto,
} from './dto/programme.dto.js';

@Injectable()
export class ProgrammesService {
  constructor(
    @InjectRepository(ProgrammeEntity)
    private readonly programmesRepo: Repository<ProgrammeEntity>,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async create(
    ctx: RequestContext,
    dto: CreateProgrammeDto,
  ): Promise<ProgrammeResponseDto> {
    await this.departmentsService.assertActiveDepartment(
      ctx.tenantId,
      dto.departmentId,
    );
    await this.assertUniqueCode(ctx.tenantId, dto.code);

    const entity = this.programmesRepo.create({
      tenantId: ctx.tenantId,
      departmentId: dto.departmentId,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      programmeGrouping: dto.programmeGrouping ?? null,
      curriculumReference: dto.curriculumReference ?? null,
      degreeLevel: dto.degreeLevel,
      status: MasterStatus.ACTIVE,
      sortOrder: dto.sortOrder ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    return this.toResponse(await this.programmesRepo.save(entity));
  }

  async list(
    ctx: RequestContext,
    query: ListProgrammesQueryDto,
  ): Promise<ProgrammeListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: {
      tenantId: string;
      status?: MasterStatus;
      departmentId?: string;
    } = { tenantId: ctx.tenantId };
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;

    const [rows, total] = await this.programmesRepo.findAndCount({
      where,
      order: { sortOrder: 'ASC', name: 'ASC' },
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
    programmeId: string,
  ): Promise<ProgrammeResponseDto> {
    return this.toResponse(
      await this.findTenantProgramme(ctx.tenantId, programmeId),
    );
  }

  async update(
    ctx: RequestContext,
    programmeId: string,
    dto: UpdateProgrammeDto,
  ): Promise<ProgrammeResponseDto> {
    const entity = await this.findTenantProgramme(ctx.tenantId, programmeId);

    if (dto.departmentId && dto.departmentId !== entity.departmentId) {
      await this.departmentsService.assertActiveDepartment(
        ctx.tenantId,
        dto.departmentId,
      );
      entity.departmentId = dto.departmentId;
    }
    if (dto.code && dto.code !== entity.code) {
      await this.assertUniqueCode(ctx.tenantId, dto.code, entity.id);
      entity.code = dto.code;
    }
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.programmeGrouping !== undefined) {
      entity.programmeGrouping = dto.programmeGrouping;
    }
    if (dto.curriculumReference !== undefined) {
      entity.curriculumReference = dto.curriculumReference;
    }
    if (dto.degreeLevel !== undefined) entity.degreeLevel = dto.degreeLevel;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder;
    entity.updatedBy = ctx.userId;

    return this.toResponse(await this.programmesRepo.save(entity));
  }

  async remove(
    ctx: RequestContext,
    programmeId: string,
  ): Promise<ProgrammeResponseDto> {
    const entity = await this.findTenantProgramme(ctx.tenantId, programmeId);
    entity.status = MasterStatus.INACTIVE;
    entity.updatedBy = ctx.userId;
    return this.toResponse(await this.programmesRepo.save(entity));
  }

  async findTenantProgramme(
    tenantId: string,
    programmeId: string,
  ): Promise<ProgrammeEntity> {
    const entity = await this.programmesRepo.findOne({
      where: { id: programmeId, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(`Programme ${programmeId} was not found`);
    }
    return entity;
  }

  private async assertUniqueCode(
    tenantId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.programmesRepo.findOne({
      where: { tenantId, code },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Programme code '${code}' already exists for this tenant`,
      );
    }
  }

  private toResponse(entity: ProgrammeEntity): ProgrammeResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      departmentId: String(entity.departmentId),
      code: entity.code,
      name: entity.name,
      description: entity.description,
      programmeGrouping: entity.programmeGrouping,
      curriculumReference: entity.curriculumReference,
      degreeLevel: entity.degreeLevel as DegreeLevel,
      status: entity.status as MasterStatus,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt.toISOString(),
      createdBy: String(entity.createdBy),
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: String(entity.updatedBy),
    };
  }
}
