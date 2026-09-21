import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiStandardErrorResponses,
  ApiTenantHeaders,
  ApiWrappedOkArrayResponse,
} from '../../common/decorators/api-docs.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { CriteriaTypesService } from './criteria-types.service.js';
import {
  CriteriaTypeListResponseDto,
  CriteriaTypeResponseDto,
} from './dto/criteria-type.dto.js';

@ApiTags('Criteria Types')
@ApiExtraModels(
  CriteriaTypeResponseDto,
  CriteriaTypeListResponseDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/criteria-types')
export class CriteriaTypesController {
  constructor(private readonly criteriaTypesService: CriteriaTypesService) {}

  @Get()
  @ApiOperation({
    summary: 'List criteria types',
    description: 'Returns the ACTIVE criteria-type catalogue used when configuring admission criteria.',
  })
  @ApiWrappedOkArrayResponse(CriteriaTypeResponseDto, 'Criteria types')
  list(
    @Query() query: PaginationQueryDto,
  ): Promise<CriteriaTypeListResponseDto> {
    return this.criteriaTypesService.list(query.page ?? 1, query.limit ?? 50);
  }
}
