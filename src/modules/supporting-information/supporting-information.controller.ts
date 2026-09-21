import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
  ApiWrappedOkResponse,
} from '../../common/decorators/api-docs.decorator.js';
import {
  ReqContext,
  type RequestContext,
} from '../../common/decorators/request-context.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import {
  CreateSupportingInformationDto,
  SupportingInformationResponseDto,
  UpdateSupportingInformationDto,
} from './dto/supporting-information.dto.js';
import { SupportingInformationService } from './supporting-information.service.js';

@ApiTags('Supporting Information')
@ApiExtraModels(
  SupportingInformationResponseDto,
  CreateSupportingInformationDto,
  UpdateSupportingInformationDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions')
export class SupportingInformationController {
  constructor(
    private readonly supportingInformationService: SupportingInformationService,
  ) {}

  @Post('offerings/:offeringId/supporting-information')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add supporting information to an offering' })
  @ApiParam({ name: 'offeringId', description: 'Offering UUID' })
  @ApiWrappedCreatedResponse(SupportingInformationResponseDto)
  create(
    @ReqContext() ctx: RequestContext,
    @Param('offeringId', new ParseUuidPipe('offeringId')) offeringId: string,
    @Body() dto: CreateSupportingInformationDto,
  ): Promise<SupportingInformationResponseDto> {
    return this.supportingInformationService.createForOffering(
      ctx,
      offeringId,
      dto,
    );
  }

  @Patch('supporting-information/:informationId')
  @ApiOperation({ summary: 'Update supporting information' })
  @ApiParam({ name: 'informationId', description: 'Supporting information UUID' })
  @ApiWrappedOkResponse(SupportingInformationResponseDto)
  update(
    @ReqContext() ctx: RequestContext,
    @Param('informationId', new ParseUuidPipe('informationId'))
    informationId: string,
    @Body() dto: UpdateSupportingInformationDto,
  ): Promise<SupportingInformationResponseDto> {
    return this.supportingInformationService.update(ctx, informationId, dto);
  }
}
