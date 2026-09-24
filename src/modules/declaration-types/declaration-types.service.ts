import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterStatus } from '../../common/enums/master-data.enum.js';
import { DeclarationTypeEntity } from '../../database/entities/declaration-type.entity.js';
import type {
  CreateDeclarationTypeDto,
  DeclarationTypeListResponseDto,
  DeclarationTypeResponseDto,
} from './dto/declaration-type.dto.js';

@Injectable()
export class DeclarationTypesService {
  constructor(
    @InjectRepository(DeclarationTypeEntity)
    private readonly declarationTypesRepo: Repository<DeclarationTypeEntity>,
  ) {}

  async create(
    dto: CreateDeclarationTypeDto,
  ): Promise<DeclarationTypeResponseDto> {
    await this.assertUniqueCode(dto.code);

    const entity = this.declarationTypesRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      status: MasterStatus.ACTIVE,
    });

    return this.toResponse(await this.declarationTypesRepo.save(entity));
  }

  async list(page = 1, limit = 50): Promise<DeclarationTypeListResponseDto> {
    const [rows, total] = await this.declarationTypesRepo.findAndCount({
      where: { status: MasterStatus.ACTIVE },
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

  private async assertUniqueCode(code: string): Promise<void> {
    const existing = await this.declarationTypesRepo.findOne({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(
        `Declaration type code '${code}' already exists`,
      );
    }
  }

  private toResponse(
    entity: DeclarationTypeEntity,
  ): DeclarationTypeResponseDto {
    return {
      id: String(entity.id),
      code: entity.code,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
