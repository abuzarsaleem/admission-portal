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
  CreateProgrammeDto,
  ListProgrammesQueryDto,
  ProgrammeListResponseDto,
  ProgrammeResponseDto,
  UpdateProgrammeDto,
} from './dto/programme.dto.js';
import { ProgrammesService } from './programmes.service.js';

@ApiTags('Programmes')
@ApiExtraModels(
  ProgrammeResponseDto,
  ProgrammeListResponseDto,
  CreateProgrammeDto,
  UpdateProgrammeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/programmes')
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a programme' })
  @ApiWrappedCreatedResponse(ProgrammeResponseDto, 'Programme created')
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateProgrammeDto,
  ): Promise<ProgrammeResponseDto> {
    return this.programmesService.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List programmes' })
  @ApiWrappedOkArrayResponse(ProgrammeResponseDto, 'Programme list')
  list(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListProgrammesQueryDto,
  ): Promise<ProgrammeListResponseDto> {
    return this.programmesService.list(ctx, query);
  }

  @Get(':programmeId')
  @ApiOperation({ summary: 'Get programme details' })
  @ApiParam({ name: 'programmeId', description: 'Programme UUID' })
  @ApiWrappedOkResponse(ProgrammeResponseDto, 'Programme details')
  getById(
    @ReqContext() ctx: RequestContext,
    @Param('programmeId', new ParseUuidPipe('programmeId'))
    programmeId: string,
  ): Promise<ProgrammeResponseDto> {
    return this.programmesService.getById(ctx, programmeId);
  }

  @Patch(':programmeId')
  @ApiOperation({ summary: 'Update a programme' })
  @ApiParam({ name: 'programmeId', description: 'Programme UUID' })
  @ApiWrappedOkResponse(ProgrammeResponseDto, 'Programme updated')
  update(
    @ReqContext() ctx: RequestContext,
    @Param('programmeId', new ParseUuidPipe('programmeId'))
    programmeId: string,
    @Body() dto: UpdateProgrammeDto,
  ): Promise<ProgrammeResponseDto> {
    return this.programmesService.update(ctx, programmeId, dto);
  }

  @Delete(':programmeId')
  @ApiOperation({
    summary: 'Deactivate a programme',
    description: 'Soft-deletes by setting status to INACTIVE.',
  })
  @ApiParam({ name: 'programmeId', description: 'Programme UUID' })
  @ApiWrappedOkResponse(ProgrammeResponseDto, 'Programme deactivated')
  remove(
    @ReqContext() ctx: RequestContext,
    @Param('programmeId', new ParseUuidPipe('programmeId'))
    programmeId: string,
  ): Promise<ProgrammeResponseDto> {
    return this.programmesService.remove(ctx, programmeId);
  }
}
