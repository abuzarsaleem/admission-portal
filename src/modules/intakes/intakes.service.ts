import {
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import {
  EDITABLE_INTAKE_STATUSES,
  IntakeStatus,
} from '../../common/enums/intake-status.enum.js';
import { IntakeEntity } from '../../database/entities/intake.entity.js';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import type { ApplicationWindowDto, CreateIntakeDto, UpdateIntakeDto } from './dto/intake-request.dto.js';
import type { ListIntakesQueryDto } from './dto/list-intakes-query.dto.js';
import type {
  IntakeListResponseDto,
  IntakeResponseDto,
} from './dto/intake-response.dto.js';

@Injectable()
export class IntakesService {
  constructor(
    @InjectRepository(IntakeEntity)
    private readonly intakesRepo: Repository<IntakeEntity>,
  ) {}

  async create(
    ctx: RequestContext,
    dto: CreateIntakeDto,
  ): Promise<IntakeResponseDto> {
    this.assertValidWindow(dto.applicationOpenAt, dto.applicationCloseAt);
    await this.assertUniqueCode(ctx.tenantId, dto.intakeCode);

    const entity = this.intakesRepo.create({
      tenantId: ctx.tenantId,
      intakeName: dto.intakeName,
      intakeCode: dto.intakeCode,
      status: IntakeStatus.DRAFT,
      applicationOpenAt: dto.applicationOpenAt,
      applicationCloseAt: dto.applicationCloseAt,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    });

    const saved = await this.intakesRepo.save(entity);
    return this.toResponse(saved);
  }

  async list(
    ctx: RequestContext,
    query: ListIntakesQueryDto,
  ): Promise<IntakeListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.intakesRepo
      .createQueryBuilder('intake')
      .where('intake.tenantId = :tenantId', { tenantId: ctx.tenantId })
      .orderBy('intake.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('intake.status = :status', { status: query.status });
    }

    const [rows, total] = await qb.getManyAndCount();

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
    intakeId: string,
  ): Promise<IntakeResponseDto> {
    const intake = await this.findTenantIntake(ctx.tenantId, intakeId);
    return this.toResponse(intake);
  }

  async update(
    ctx: RequestContext,
    intakeId: string,
    dto: UpdateIntakeDto,
  ): Promise<IntakeResponseDto> {
    if (!dto.intakeName && !dto.intakeCode) {
      throw new BusinessException(
        'At least one of intakeName or intakeCode is required',
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
      );
    }

    const intake = await this.findTenantIntake(ctx.tenantId, intakeId);
    this.assertEditable(intake);

    if (dto.intakeCode && dto.intakeCode !== intake.intakeCode) {
      await this.assertUniqueCode(ctx.tenantId, dto.intakeCode, intake.id);
      intake.intakeCode = dto.intakeCode;
    }
    if (dto.intakeName) {
      intake.intakeName = dto.intakeName;
    }

    intake.updatedBy = ctx.userId;
    const saved = await this.intakesRepo.save(intake);
    return this.toResponse(saved);
  }

  async updateApplicationWindow(
    ctx: RequestContext,
    intakeId: string,
    dto: ApplicationWindowDto,
  ): Promise<IntakeResponseDto> {
    const intake = await this.findTenantIntake(ctx.tenantId, intakeId);
    this.assertEditable(intake);
    this.assertValidWindow(dto.applicationOpenAt, dto.applicationCloseAt);

    intake.applicationOpenAt = dto.applicationOpenAt;
    intake.applicationCloseAt = dto.applicationCloseAt;
    intake.updatedBy = ctx.userId;

    const saved = await this.intakesRepo.save(intake);
    return this.toResponse(saved);
  }

  async findTenantIntake(
    tenantId: string,
    intakeId: string,
  ): Promise<IntakeEntity> {
    const intake = await this.intakesRepo.findOne({
      where: { id: intakeId, tenantId },
    });
    if (!intake) {
      throw new NotFoundException(`Intake ${intakeId} was not found`);
    }
    return intake;
  }

  /**
   * Moves DRAFT → CONFIGURED once configuration work starts
   * (first offering / criteria / fees / supporting information).
   */
  async markConfiguredIfDraft(
    tenantId: string,
    intakeId: string,
    userId: string,
  ): Promise<IntakeEntity> {
    const intake = await this.findTenantIntake(tenantId, intakeId);
    if (intake.status === IntakeStatus.DRAFT) {
      intake.status = IntakeStatus.CONFIGURED;
      intake.updatedBy = userId;
      return this.intakesRepo.save(intake);
    }
    return intake;
  }

  private async assertUniqueCode(
    tenantId: string,
    intakeCode: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.intakesRepo.findOne({
      where: { tenantId, intakeCode: intakeCode.trim() },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Intake code '${intakeCode}' already exists for this tenant`,
      );
    }
  }

  private assertEditable(intake: IntakeEntity): void {
    if (!EDITABLE_INTAKE_STATUSES.includes(intake.status as IntakeStatus)) {
      throw new ForbiddenException(
        `Intake in status ${intake.status} cannot be modified`,
      );
    }
  }

  private assertValidWindow(openAt: Date, closeAt: Date): void {
    if (!(openAt instanceof Date) || Number.isNaN(openAt.getTime())) {
      throw new BusinessException('applicationOpenAt must be a valid datetime');
    }
    if (!(closeAt instanceof Date) || Number.isNaN(closeAt.getTime())) {
      throw new BusinessException('applicationCloseAt must be a valid datetime');
    }
    if (closeAt.getTime() <= openAt.getTime()) {
      throw new BusinessException(
        'applicationCloseAt must be after applicationOpenAt',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'INVALID_APPLICATION_WINDOW',
      );
    }
  }

  toResponse(entity: IntakeEntity): IntakeResponseDto {
    return {
      id: String(entity.id),
      tenantId: String(entity.tenantId),
      intakeName: entity.intakeName,
      intakeCode: entity.intakeCode,
      status: entity.status as IntakeStatus,
      applicationOpenAt: entity.applicationOpenAt.toISOString(),
      applicationCloseAt: entity.applicationCloseAt.toISOString(),
      publishedAt: entity.publishedAt
        ? entity.publishedAt.toISOString()
        : null,
      publishedBy: entity.publishedBy ? String(entity.publishedBy) : null,
      createdAt: entity.createdAt.toISOString(),
      createdBy: String(entity.createdBy),
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: String(entity.updatedBy),
    };
  }
}
