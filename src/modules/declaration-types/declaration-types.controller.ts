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
import { DeclarationTypesService } from './declaration-types.service.js';
import {
  CreateDeclarationTypeDto,
  DeclarationTypeListResponseDto,
  DeclarationTypeResponseDto,
  ListDeclarationTypesQueryDto,
} from './dto/declaration-type.dto.js';

@ApiTags('Declaration Types')
@ApiExtraModels(
  DeclarationTypeResponseDto,
  DeclarationTypeListResponseDto,
  CreateDeclarationTypeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/declaration-types')
export class DeclarationTypesController {
  constructor(
    private readonly declarationTypesService: DeclarationTypesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a declaration type',
    description:
      'Adds a catalogue entry used when configuring general/offering declarations.',
  })
  @ApiWrappedCreatedResponse(
    DeclarationTypeResponseDto,
    'Declaration type created',
  )
  create(
    @Body() dto: CreateDeclarationTypeDto,
  ): Promise<DeclarationTypeResponseDto> {
    return this.declarationTypesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List declaration types',
    description: 'Returns ACTIVE declaration-type catalogue entries.',
  })
  @ApiWrappedOkArrayResponse(DeclarationTypeResponseDto, 'Declaration types')
  list(
    @Query() query: ListDeclarationTypesQueryDto,
  ): Promise<DeclarationTypeListResponseDto> {
    return this.declarationTypesService.list(
      query.page ?? 1,
      query.limit ?? 50,
    );
  }
}
