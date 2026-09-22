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
import { DepartmentsService } from './departments.service.js';
import {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  DepartmentResponseDto,
  ListDepartmentsQueryDto,
  MasterDataStatsDto,
  UpdateDepartmentDto,
} from './dto/department.dto.js';

@ApiTags('Departments')
@ApiExtraModels(
  DepartmentResponseDto,
  DepartmentListResponseDto,
  MasterDataStatsDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a department' })
  @ApiWrappedCreatedResponse(DepartmentResponseDto, 'Department created')
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List departments' })
  @ApiWrappedOkArrayResponse(DepartmentResponseDto, 'Department list')
  list(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListDepartmentsQueryDto,
  ): Promise<DepartmentListResponseDto> {
    return this.departmentsService.list(ctx, query);
  }

  @Get(':departmentId')
  @ApiOperation({ summary: 'Get department details' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiWrappedOkResponse(DepartmentResponseDto, 'Department details')
  getById(
    @ReqContext() ctx: RequestContext,
    @Param('departmentId', new ParseUuidPipe('departmentId'))
    departmentId: string,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.getById(ctx, departmentId);
  }

  @Patch(':departmentId')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiWrappedOkResponse(DepartmentResponseDto, 'Department updated')
  update(
    @ReqContext() ctx: RequestContext,
    @Param('departmentId', new ParseUuidPipe('departmentId'))
    departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.update(ctx, departmentId, dto);
  }

  @Delete(':departmentId')
  @ApiOperation({
    summary: 'Deactivate a department',
    description: 'Soft-deletes by setting status to INACTIVE.',
  })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiWrappedOkResponse(DepartmentResponseDto, 'Department deactivated')
  remove(
    @ReqContext() ctx: RequestContext,
    @Param('departmentId', new ParseUuidPipe('departmentId'))
    departmentId: string,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.remove(ctx, departmentId);
  }
}

@ApiTags('Departments')
@ApiExtraModels(MasterDataStatsDto, ApiErrorResponseDto)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions')
export class MasterDataStatsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get('departments-programmes/stats')
  @ApiOperation({
    summary: 'Get department and programme stats',
    description:
      'Single dashboard payload: total/active/inactive for departments and programmes.',
  })
  @ApiWrappedOkResponse(MasterDataStatsDto, 'Department and programme stats')
  getStats(@ReqContext() ctx: RequestContext): Promise<MasterDataStatsDto> {
    return this.departmentsService.getMasterDataStats(ctx);
  }
}
