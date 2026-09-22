import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
  ApplicationWindowDto,
  CreateIntakeDto,
  UpdateIntakeDto,
} from './dto/intake-request.dto.js';
import {
  IntakeListResponseDto,
  IntakeResponseDto,
  IntakeStatusSummaryDto,
} from './dto/intake-response.dto.js';
import { ListIntakesQueryDto } from './dto/list-intakes-query.dto.js';
import { IntakesService } from './intakes.service.js';

@ApiTags('Intake')
@ApiExtraModels(
  IntakeResponseDto,
  IntakeListResponseDto,
  IntakeStatusSummaryDto,
  ApiErrorResponseDto,
  CreateIntakeDto,
  UpdateIntakeDto,
  ApplicationWindowDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/intake')
export class IntakesController {
  constructor(private readonly intakesService: IntakesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new intake',
    description:
      'Creates a tenant-scoped intake session in DRAFT status with an application window. ' +
      'Validates name/code format and that applicationCloseAt is after applicationOpenAt.',
  })
  @ApiWrappedCreatedResponse(IntakeResponseDto, 'Intake created')
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateIntakeDto,
  ): Promise<IntakeResponseDto> {
    return this.intakesService.create(ctx, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List tenant intakes',
    description:
      'Returns a paginated list of intakes for the active tenant with optional status filter. ' +
      'Also returns tenant-wide `summary` counts for dashboard cards (total, draft, configured, underReview, published, closed).',
  })
  @ApiWrappedOkArrayResponse(IntakeResponseDto, 'Intake list')
  list(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListIntakesQueryDto,
  ): Promise<IntakeListResponseDto> {
    return this.intakesService.list(ctx, query);
  }

  @Get(':intakeId')
  @ApiOperation({
    summary: 'Get intake details',
    description: 'Returns a single intake by ID within the active tenant.',
  })
  @ApiParam({
    name: 'intakeId',
    description: 'Intake UUID',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  @ApiWrappedOkResponse(IntakeResponseDto, 'Intake details')
  getById(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
  ): Promise<IntakeResponseDto> {
    return this.intakesService.getById(ctx, intakeId);
  }

  @Patch(':intakeId')
  @ApiOperation({
    summary: 'Update intake/session information',
    description:
      'Updates intake name and/or code. At least one field is required. ' +
      'Allowed only while status is DRAFT, CONFIGURED, or UNDER_REVIEW.',
  })
  @ApiParam({
    name: 'intakeId',
    description: 'Intake UUID',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  @ApiWrappedOkResponse(IntakeResponseDto, 'Intake updated')
  update(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
    @Body() dto: UpdateIntakeDto,
  ): Promise<IntakeResponseDto> {
    return this.intakesService.update(ctx, intakeId, dto);
  }

  @Put(':intakeId/application-window')
  @ApiOperation({
    summary: 'Configure application opening/closing dates',
    description:
      'Replaces the application window. applicationCloseAt must be strictly after applicationOpenAt. ' +
      'Allowed only while editable.',
  })
  @ApiParam({
    name: 'intakeId',
    description: 'Intake UUID',
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  @ApiWrappedOkResponse(IntakeResponseDto, 'Application window updated')
  updateApplicationWindow(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
    @Body() dto: ApplicationWindowDto,
  ): Promise<IntakeResponseDto> {
    return this.intakesService.updateApplicationWindow(ctx, intakeId, dto);
  }
}
