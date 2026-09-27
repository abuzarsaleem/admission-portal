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
  CreateGeneralDeclarationDto,
  GeneralDeclarationListResponseDto,
  GeneralDeclarationResponseDto,
  ListGeneralDeclarationsQueryDto,
  UpdateGeneralDeclarationDto,
} from './dto/general-declaration.dto.js';
import { GeneralDeclarationsService } from './general-declarations.service.js';

@ApiTags('General Declarations')
@ApiExtraModels(
  GeneralDeclarationResponseDto,
  GeneralDeclarationListResponseDto,
  CreateGeneralDeclarationDto,
  UpdateGeneralDeclarationDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/general-declarations')
export class GeneralDeclarationsController {
  constructor(
    private readonly generalDeclarationsService: GeneralDeclarationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a general declaration',
    description:
      'Creates a reusable institution-wide declaration that can be cloned onto offerings.',
  })
  @ApiWrappedCreatedResponse(
    GeneralDeclarationResponseDto,
    'General declaration created',
  )
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateGeneralDeclarationDto,
  ): Promise<GeneralDeclarationResponseDto> {
    return this.generalDeclarationsService.create(ctx, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List general declarations' })
  @ApiWrappedOkArrayResponse(
    GeneralDeclarationResponseDto,
    'General declaration list',
  )
  list(
    @ReqContext() ctx: RequestContext,
    @Query() query: ListGeneralDeclarationsQueryDto,
  ): Promise<GeneralDeclarationListResponseDto> {
    return this.generalDeclarationsService.list(ctx, query);
  }

  @Get(':generalDeclarationId')
  @ApiOperation({ summary: 'Get general declaration details' })
  @ApiParam({
    name: 'generalDeclarationId',
    description: 'General declaration UUID',
  })
  @ApiWrappedOkResponse(
    GeneralDeclarationResponseDto,
    'General declaration details',
  )
  getById(
    @ReqContext() ctx: RequestContext,
    @Param('generalDeclarationId', new ParseUuidPipe('generalDeclarationId'))
    generalDeclarationId: string,
  ): Promise<GeneralDeclarationResponseDto> {
    return this.generalDeclarationsService.getById(ctx, generalDeclarationId);
  }

  @Patch(':generalDeclarationId')
  @ApiOperation({ summary: 'Update a general declaration' })
  @ApiParam({
    name: 'generalDeclarationId',
    description: 'General declaration UUID',
  })
  @ApiWrappedOkResponse(
    GeneralDeclarationResponseDto,
    'General declaration updated',
  )
  update(
    @ReqContext() ctx: RequestContext,
    @Param('generalDeclarationId', new ParseUuidPipe('generalDeclarationId'))
    generalDeclarationId: string,
    @Body() dto: UpdateGeneralDeclarationDto,
  ): Promise<GeneralDeclarationResponseDto> {
    return this.generalDeclarationsService.update(
      ctx,
      generalDeclarationId,
      dto,
    );
  }

  @Delete(':generalDeclarationId')
  @ApiOperation({
    summary: 'Deactivate a general declaration',
    description: 'Soft-deletes by setting status to INACTIVE.',
  })
  @ApiParam({
    name: 'generalDeclarationId',
    description: 'General declaration UUID',
  })
  @ApiWrappedOkResponse(
    GeneralDeclarationResponseDto,
    'General declaration deactivated',
  )
  remove(
    @ReqContext() ctx: RequestContext,
    @Param('generalDeclarationId', new ParseUuidPipe('generalDeclarationId'))
    generalDeclarationId: string,
  ): Promise<GeneralDeclarationResponseDto> {
    return this.generalDeclarationsService.remove(ctx, generalDeclarationId);
  }
}
