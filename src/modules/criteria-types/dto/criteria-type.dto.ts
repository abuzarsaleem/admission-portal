import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';

export class CriteriaTypeResponseDto {
  @ApiProperty({ example: '22222222-2222-4222-8222-222222222002' })
  id!: string;

  @ApiProperty({ example: 'MIN_PERCENTAGE' })
  code!: string;

  @ApiProperty({ example: 'Minimum Percentage' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'NUMBER' })
  valueDataType!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiPropertyOptional({ nullable: true, example: 2 })
  sortOrder!: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CriteriaTypeListResponseDto {
  @ApiProperty({ type: [CriteriaTypeResponseDto] })
  items!: CriteriaTypeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
