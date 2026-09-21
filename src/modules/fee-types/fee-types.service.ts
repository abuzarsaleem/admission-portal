import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeTypeEntity } from '../../database/entities/fee-type.entity.js';
import type {
  CreateFeeTypeDto,
  FeeTypeListResponseDto,
  FeeTypeResponseDto,
} from './dto/fee-type.dto.js';

@Injectable()
export class FeeTypesService {
  constructor(
    @InjectRepository(FeeTypeEntity)
    private readonly feeTypesRepo: Repository<FeeTypeEntity>,
  ) {}

  async create(dto: CreateFeeTypeDto): Promise<FeeTypeResponseDto> {
    await this.assertUniqueName(dto.name);

    const entity = this.feeTypesRepo.create({ name: dto.name });
    return this.toResponse(await this.feeTypesRepo.save(entity));
  }

  async list(page = 1, limit = 50): Promise<FeeTypeListResponseDto> {
    const [rows, total] = await this.feeTypesRepo.findAndCount({
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

  private async assertUniqueName(name: string): Promise<void> {
    const existing = await this.feeTypesRepo.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`Fee type '${name}' already exists`);
    }
  }

  private toResponse(entity: FeeTypeEntity): FeeTypeResponseDto {
    return {
      id: String(entity.id),
      name: entity.name,
    };
  }
}
