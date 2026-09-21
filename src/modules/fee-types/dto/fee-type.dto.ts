import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto.js';

export class FeeTypeResponseDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111001' })
  id!: string;

  @ApiProperty({ example: 'APPLICATION' })
  name!: string;
}

export class FeeTypeListResponseDto {
  @ApiProperty({ type: [FeeTypeResponseDto] })
  items!: FeeTypeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
