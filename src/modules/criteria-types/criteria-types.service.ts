import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterStatus } from '../../common/enums/master-data.enum.js';
import { CriteriaTypeEntity } from '../../database/entities/criteria-type.entity.js';
import type {
  CreateCriteriaTypeDto,
  CriteriaTypeListResponseDto,
  CriteriaTypeResponseDto,
} from './dto/criteria-type.dto.js';
import { CriteriaValueDataType } from './dto/criteria-type.dto.js';

@Injectable()
export class CriteriaTypesService {
  constructor(
    @InjectRepository(CriteriaTypeEntity)
    private readonly criteriaTypesRepo: Repository<CriteriaTypeEntity>,
  ) {}

  async create(dto: CreateCriteriaTypeDto): Promise<CriteriaTypeResponseDto> {
    await this.assertUniqueCode(dto.code);

    const entity = this.criteriaTypesRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      valueDataType: dto.valueDataType ?? CriteriaValueDataType.TEXT,
      status: MasterStatus.ACTIVE,
      sortOrder: dto.sortOrder ?? null,
    });

    return this.toResponse(await this.criteriaTypesRepo.save(entity));
  }

  async list(page = 1, limit = 50): Promise<CriteriaTypeListResponseDto> {
    const [rows, total] = await this.criteriaTypesRepo.findAndCount({
      where: { status: MasterStatus.ACTIVE },
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

  private async assertUniqueCode(code: string): Promise<void> {
    const existing = await this.criteriaTypesRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Criteria type code '${code}' already exists`);
    }
  }

  private toResponse(entity: CriteriaTypeEntity): CriteriaTypeResponseDto {
    return {
      id: String(entity.id),
      code: entity.code,
      name: entity.name,
      description: entity.description,
      valueDataType: entity.valueDataType,
      status: entity.status,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
