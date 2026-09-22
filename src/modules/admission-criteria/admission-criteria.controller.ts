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
  ApiBody,
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
  AdmissionCriterionBatchResponseDto,
  AdmissionCriterionResponseDto,
  CreateAdmissionCriterionDto,
  CreateAdmissionCriterionItemDto,
  UpdateAdmissionCriterionDto,
} from './dto/admission-criterion.dto.js';
import { AdmissionCriteriaService } from './admission-criteria.service.js';

@ApiTags('Admission Criteria')
@ApiExtraModels(
  AdmissionCriterionResponseDto,
  AdmissionCriterionBatchResponseDto,
  CreateAdmissionCriterionDto,
  CreateAdmissionCriterionItemDto,
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

  @Post('offerings/criteria')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create admission criterion(s)',
    description:
      'Attaches one or more criteria (`criteria[]`) to one or more editable offerings (`offeringIds`). ' +
      'Each criteria item uses **one** of:\n' +
      '1) `generalCriteriaId` — link an existing general criteria master\n' +
      '2) `criteriaTypeId` + `criteriaRequirement` — create a new general criterion and link it\n' +
      'Do not send both on the same item.',
  })
  @ApiBody({
    type: CreateAdmissionCriterionDto,
    examples: {
      attachExisting: {
        summary: 'Attach multiple existing criteria to offerings',
        value: {
          offeringIds: [
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
          ],
          criteria: [
            {
              generalCriteriaId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
              sequenceNo: 1,
              effectiveFrom: '2026-07-01T00:00:00.000Z',
              effectiveTo: '2026-09-15T23:59:59.000Z',
            },
            {
              generalCriteriaId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
              sequenceNo: 2,
            },
          ],
        },
      },
      createInline: {
        summary: 'Create criteria masters inline and attach',
        value: {
          offeringIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'],
          criteria: [
            {
              criteriaTypeId: '22222222-2222-4222-8222-222222222002',
              criteriaName: 'Minimum Percentage',
              criteriaRequirement: 'Minimum 50% overall marks',
              criteriaOperator: 'GREATER_THAN_OR_EQUAL',
              criteriaUnit: 'PERCENTAGE',
              mandatory: true,
              sequenceNo: 1,
            },
          ],
        },
      },
    },
  })
  @ApiWrappedCreatedResponse(
    AdmissionCriterionBatchResponseDto,
    'Admission criterion(s) created',
  )
  createForOfferings(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateAdmissionCriterionDto,
  ): Promise<AdmissionCriterionBatchResponseDto> {
    return this.admissionCriteriaService.createForOfferings(ctx, dto);
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
