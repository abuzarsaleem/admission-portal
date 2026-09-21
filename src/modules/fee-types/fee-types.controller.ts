import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiStandardErrorResponses,
  ApiTenantHeaders,
  ApiWrappedCreatedResponse,
  ApiWrappedOkArrayResponse,
} from '../../common/decorators/api-docs.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import {
  CreateFeeTypeDto,
  FeeTypeListResponseDto,
  FeeTypeResponseDto,
} from './dto/fee-type.dto.js';
import { FeeTypesService } from './fee-types.service.js';

@ApiTags('Fee Types')
@ApiExtraModels(
  FeeTypeResponseDto,
  FeeTypeListResponseDto,
  CreateFeeTypeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/fee-types')
export class FeeTypesController {
  constructor(private readonly feeTypesService: FeeTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a fee type',
    description:
      'Adds a new entry to the fee-type catalogue used when configuring general/offering fees.',
  })
  @ApiWrappedCreatedResponse(FeeTypeResponseDto, 'Fee type created')
  create(@Body() dto: CreateFeeTypeDto): Promise<FeeTypeResponseDto> {
    return this.feeTypesService.create(dto);
  }

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
