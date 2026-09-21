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
  CreateGeneralFeeDto,
  GeneralFeeListResponseDto,
  GeneralFeeResponseDto,
  ListGeneralFeesQueryDto,
  UpdateGeneralFeeDto,
} from './dto/general-fee.dto.js';
import { ProgrammeFeesService } from './programme-fees.service.js';

@ApiTags('General Fees')
@ApiExtraModels(
  GeneralFeeResponseDto,
  GeneralFeeListResponseDto,
  CreateGeneralFeeDto,
  UpdateGeneralFeeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/general-fees')
export class ProgrammeFeesController {
  constructor(private readonly programmeFeesService: ProgrammeFeesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a general fee (programme fee master)',
    description:
      'Creates a reusable tenant fee master that can be attached to offerings via generalFeeId.',
  })
  @ApiWrappedCreatedResponse(GeneralFeeResponseDto, 'General fee created')
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateGeneralFeeDto,
  ): Promise<GeneralFeeResponseDto> {
    return this.programmeFeesService.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List general fees' })
  @ApiWrappedOkArrayResponse(GeneralFeeResponseDto, 'General fee list')
  list(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListGeneralFeesQueryDto,
  ): Promise<GeneralFeeListResponseDto> {
    return this.programmeFeesService.list(ctx, query);
  }

  @Get(':generalFeeId')
  @ApiOperation({ summary: 'Get general fee details' })
  @ApiParam({ name: 'generalFeeId', description: 'General fee UUID' })
  @ApiWrappedOkResponse(GeneralFeeResponseDto, 'General fee details')
  getById(
    @ReqContext() ctx: RequestContext,
    @Param('generalFeeId', new ParseUuidPipe('generalFeeId'))
    generalFeeId: string,
  ): Promise<GeneralFeeResponseDto> {
    return this.programmeFeesService.getById(ctx, generalFeeId);
  }

  @Patch(':generalFeeId')
  @ApiOperation({ summary: 'Update a general fee' })
  @ApiParam({ name: 'generalFeeId', description: 'General fee UUID' })
  @ApiWrappedOkResponse(GeneralFeeResponseDto, 'General fee updated')
  update(
    @ReqContext() ctx: RequestContext,
    @Param('generalFeeId', new ParseUuidPipe('generalFeeId'))
    generalFeeId: string,
    @Body() dto: UpdateGeneralFeeDto,
  ): Promise<GeneralFeeResponseDto> {
    return this.programmeFeesService.update(ctx, generalFeeId, dto);
  }

  @Delete(':generalFeeId')
  @ApiOperation({
    summary: 'Deactivate a general fee',
    description: 'Soft-deletes by setting status to INACTIVE.',
  })
  @ApiParam({ name: 'generalFeeId', description: 'General fee UUID' })
  @ApiWrappedOkResponse(GeneralFeeResponseDto, 'General fee deactivated')
  remove(
    @ReqContext() ctx: RequestContext,
    @Param('generalFeeId', new ParseUuidPipe('generalFeeId'))
    generalFeeId: string,
  ): Promise<GeneralFeeResponseDto> {
    return this.programmeFeesService.remove(ctx, generalFeeId);
  }
}
