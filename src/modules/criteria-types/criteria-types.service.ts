import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CriteriaTypeEntity } from '../../database/entities/criteria-type.entity.js';
import type {
  CriteriaTypeListResponseDto,
  CriteriaTypeResponseDto,
} from './dto/criteria-type.dto.js';

@Injectable()
export class CriteriaTypesService {
  constructor(
    @InjectRepository(CriteriaTypeEntity)
    private readonly criteriaTypesRepo: Repository<CriteriaTypeEntity>,
  ) {}

  async list(page = 1, limit = 50): Promise<CriteriaTypeListResponseDto> {
    const [rows, total] = await this.criteriaTypesRepo.findAndCount({
      where: { status: 'ACTIVE' },
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
