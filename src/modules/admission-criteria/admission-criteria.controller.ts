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
  AdmissionCriterionResponseDto,
  CreateAdmissionCriterionDto,
  UpdateAdmissionCriterionDto,
} from './dto/admission-criterion.dto.js';
import { AdmissionCriteriaService } from './admission-criteria.service.js';

@ApiTags('Admission Criteria')
@ApiExtraModels(
  AdmissionCriterionResponseDto,
  CreateAdmissionCriterionDto,
  UpdateAdmissionCriterionDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions')
export class AdmissionCriteriaController {
  constructor(
    private readonly admissionCriteriaService: AdmissionCriteriaService,
  ) {}

  @Post('offerings/:offeringId/criteria')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create admission criterion',
    description:
      'Creates an applicant-facing criterion for an editable offering. ' +
      'Uses an ACTIVE criteria type and stores requirement/operator/unit plus effective dates.',
  })
  @ApiParam({
    name: 'offeringId',
    description: 'Offering UUID',
    example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  })
  @ApiWrappedCreatedResponse(
    AdmissionCriterionResponseDto,
    'Admission criterion created',
  )
  createForOffering(
    @ReqContext() ctx: RequestContext,
    @Param('offeringId', new ParseUuidPipe('offeringId'))
    offeringId: string,
    @Body() dto: CreateAdmissionCriterionDto,
  ): Promise<AdmissionCriterionResponseDto> {
    return this.admissionCriteriaService.createForOffering(
      ctx,
      offeringId,
      dto,
    );
  }

  @Patch('criteria/:criteriaId')
  @ApiOperation({
    summary: 'Update admission criterion',
    description:
      'Updates criterion definition and/or effective window. At least one field is required. ' +
      'Allowed only while the parent offering/intake remain editable.',
  })
  @ApiParam({
    name: 'criteriaId',
    description: 'Admission criterion UUID',
    example: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  })
  @ApiWrappedOkResponse(
    AdmissionCriterionResponseDto,
    'Admission criterion updated',
  )
  update(
    @ReqContext() ctx: RequestContext,
    @Param('criteriaId', new ParseUuidPipe('criteriaId'))
    criteriaId: string,
    @Body() dto: UpdateAdmissionCriterionDto,
  ): Promise<AdmissionCriterionResponseDto> {
    return this.admissionCriteriaService.update(ctx, criteriaId, dto);
  }
}
