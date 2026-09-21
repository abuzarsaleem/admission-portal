import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiStandardErrorResponses,
  ApiTenantHeaders,
  ApiWrappedCreatedResponse,
  ApiWrappedOkArrayResponse,
  ApiWrappedOkResponse,
} from '../../common/decorators/api-docs.decorator.js';
import {
  ReqContext,
  type RequestContext,
} from '../../common/decorators/request-context.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import {
  CreateGeneralCriterionDto,
  GeneralCriterionListResponseDto,
  GeneralCriterionResponseDto,
  ListGeneralCriteriaQueryDto,
  UpdateGeneralCriterionDto,
} from './dto/general-criterion.dto.js';
import { GeneralCriteriaService } from './general-criteria.service.js';

@ApiTags('General Criteria')
@ApiExtraModels(
  GeneralCriterionResponseDto,
  GeneralCriterionListResponseDto,
  CreateGeneralCriterionDto,
  UpdateGeneralCriterionDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/general-criteria')
export class GeneralCriteriaController {
  constructor(private readonly generalCriteriaService: GeneralCriteriaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a general criterion (criteria master)',
    description:
      'Creates a reusable tenant criteria master that can be attached to offerings via generalCriteriaId.',
  })
  @ApiWrappedCreatedResponse(
    GeneralCriterionResponseDto,
    'General criterion created',
  )
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateGeneralCriterionDto,
  ): Promise<GeneralCriterionResponseDto> {
    return this.generalCriteriaService.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List general criteria' })
  @ApiWrappedOkArrayResponse(
    GeneralCriterionResponseDto,
    'General criteria list',
  )
  list(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListGeneralCriteriaQueryDto,
  ): Promise<GeneralCriterionListResponseDto> {
    return this.generalCriteriaService.list(ctx, query);
  }

  @Get(':generalCriteriaId')
  @ApiOperation({ summary: 'Get general criterion details' })
  @ApiParam({ name: 'generalCriteriaId', description: 'General criteria UUID' })
  @ApiWrappedOkResponse(
    GeneralCriterionResponseDto,
    'General criterion details',
  )
  getById(
    @ReqContext() ctx: RequestContext,
    @Param('generalCriteriaId', new ParseUuidPipe('generalCriteriaId'))
    generalCriteriaId: string,
  ): Promise<GeneralCriterionResponseDto> {
    return this.generalCriteriaService.getById(ctx, generalCriteriaId);
  }

  @Patch(':generalCriteriaId')
  @ApiOperation({ summary: 'Update a general criterion' })
  @ApiParam({ name: 'generalCriteriaId', description: 'General criteria UUID' })
  @ApiWrappedOkResponse(
    GeneralCriterionResponseDto,
    'General criterion updated',
  )
  update(
    @ReqContext() ctx: RequestContext,
    @Param('generalCriteriaId', new ParseUuidPipe('generalCriteriaId'))
    generalCriteriaId: string,
    @Body() dto: UpdateGeneralCriterionDto,
  ): Promise<GeneralCriterionResponseDto> {
    return this.generalCriteriaService.update(ctx, generalCriteriaId, dto);
  }

  @Delete(':generalCriteriaId')
  @ApiOperation({
    summary: 'Delete a general criterion',
    description:
      'Hard-deletes the master record. Fails with 409 if it is still attached to any offering criterion.',
  })
  @ApiParam({ name: 'generalCriteriaId', description: 'General criteria UUID' })
  @ApiWrappedOkResponse(
    GeneralCriterionResponseDto,
    'General criterion deleted',
  )
  remove(
    @ReqContext() ctx: RequestContext,
    @Param('generalCriteriaId', new ParseUuidPipe('generalCriteriaId'))
    generalCriteriaId: string,
  ): Promise<GeneralCriterionResponseDto> {
    return this.generalCriteriaService.remove(ctx, generalCriteriaId);
  }
}
