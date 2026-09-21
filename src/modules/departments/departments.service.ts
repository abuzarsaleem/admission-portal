import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import { MasterStatus } from '../../common/enums/master-data.enum.js';
import { DepartmentEntity } from '../../database/entities/department.entity.js';
import type {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  DepartmentResponseDto,
  ListDepartmentsQueryDto,
  UpdateDepartmentDto,
} from './dto/department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepo: Repository<DepartmentEntity>,
  ) {}

  async create(
    ctx: RequestContext,
    dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    await this.assertUniqueCode(ctx.tenantId, dto.code);

    const entity = this.departmentsRepo.create({
      tenantId: ctx.tenantId,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      status: MasterStatus.ACTIVE,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    return this.toResponse(await this.departmentsRepo.save(entity));
  }

  async list(
    ctx: RequestContext,
    query: ListDepartmentsQueryDto,
  ): Promise<DepartmentListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: { tenantId: string; status?: MasterStatus } = {
      tenantId: ctx.tenantId,
    };
    if (query.status) where.status = query.status;

    const [rows, total] = await this.departmentsRepo.findAndCount({
      where,
      order: { name: 'ASC' },
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
    departmentId: string,
  ): Promise<DepartmentResponseDto> {
    return this.toResponse(
      await this.findTenantDepartment(ctx.tenantId, departmentId),
    );
  }

  async update(
    ctx: RequestContext,
    departmentId: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const entity = await this.findTenantDepartment(ctx.tenantId, departmentId);

    if (dto.code && dto.code !== entity.code) {
      await this.assertUniqueCode(ctx.tenantId, dto.code, entity.id);
      entity.code = dto.code;
    }
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = ctx.userId;

    return this.toResponse(await this.departmentsRepo.save(entity));
  }

  async remove(
    ctx: RequestContext,
    departmentId: string,
  ): Promise<DepartmentResponseDto> {
    const entity = await this.findTenantDepartment(ctx.tenantId, departmentId);
    entity.status = MasterStatus.INACTIVE;
    entity.updatedBy = ctx.userId;
    return this.toResponse(await this.departmentsRepo.save(entity));
  }

  async findTenantDepartment(
    tenantId: string,
    departmentId: string,
  ): Promise<DepartmentEntity> {
    const entity = await this.departmentsRepo.findOne({
      where: { id: departmentId, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(`Department ${departmentId} was not found`);
    }
    return entity;
  }

  async assertActiveDepartment(
    tenantId: string,
    departmentId: string,
  ): Promise<DepartmentEntity> {
    const entity = await this.findTenantDepartment(tenantId, departmentId);
    if (entity.status !== MasterStatus.ACTIVE) {
      throw new ConflictException(
        `Department ${departmentId} is not ACTIVE`,
      );
    }
    return entity;
  }

  private async assertUniqueCode(
    tenantId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.departmentsRepo.findOne({
      where: { tenantId, code },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Department code '${code}' already exists for this tenant`,
      );
    }
  }

  private toResponse(entity: DepartmentEntity): DepartmentResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      code: entity.code,
      name: entity.name,
      description: entity.description,
      status: entity.status as MasterStatus,
      createdAt: entity.createdAt.toISOString(),
      createdBy: String(entity.createdBy),
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: String(entity.updatedBy),
    };
  }
}
