import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiStandardErrorResponses,
  ApiTenantHeaders,
  ApiWrappedOkArrayResponse,
} from '../../common/decorators/api-docs.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import {
  FeeTypeListResponseDto,
  FeeTypeResponseDto,
} from './dto/fee-type.dto.js';
import { FeeTypesService } from './fee-types.service.js';

@ApiTags('Fee Types')
@ApiExtraModels(FeeTypeResponseDto, FeeTypeListResponseDto, ApiErrorResponseDto)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/fee-types')
export class FeeTypesController {
  constructor(private readonly feeTypesService: FeeTypesService) {}

  @Get()
  @ApiOperation({
    summary: 'List fee types',
    description: 'Returns the fee-type catalogue used when configuring offering fees.',
  })
  @ApiWrappedOkArrayResponse(FeeTypeResponseDto, 'Fee types')
  list(@Query() query: PaginationQueryDto): Promise<FeeTypeListResponseDto> {
    return this.feeTypesService.list(query.page ?? 1, query.limit ?? 50);
  }
}
