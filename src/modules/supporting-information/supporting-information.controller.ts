import {
  Body,
  Controller,
  Get,
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
  CreateSupportingInformationDto,
  CreateSupportingInformationItemDto,
  SupportingInformationBatchResponseDto,
  SupportingInformationResponseDto,
  UpdateSupportingInformationDto,
} from './dto/supporting-information.dto.js';
import { SupportingInformationService } from './supporting-information.service.js';

@ApiTags('Supporting Information')
@ApiExtraModels(
  SupportingInformationResponseDto,
  SupportingInformationBatchResponseDto,
  CreateSupportingInformationDto,
  CreateSupportingInformationItemDto,
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

  @Get('offerings/:offeringId/supporting-information')
  @ApiOperation({
    summary: 'List supporting information for an offering',
    description:
      'Returns all supporting-information entries on the offering (admin view).',
  })
  @ApiParam({
    name: 'offeringId',
    description: 'Offering UUID',
    example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  })
  @ApiWrappedOkResponse(
    SupportingInformationBatchResponseDto,
    'Supporting information for offering',
  )
  listByOffering(
    @ReqContext() ctx: RequestContext,
    @Param('offeringId', new ParseUuidPipe('offeringId')) offeringId: string,
  ): Promise<SupportingInformationBatchResponseDto> {
    return this.supportingInformationService.listByOffering(ctx, offeringId);
  }

  @Post('offerings/supporting-information')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add supporting information to offering(s)',
    description:
      'Attaches one or more supporting-information entries (`items[]`) to one or more editable offerings (`offeringIds`).',
  })
  @ApiBody({
    type: CreateSupportingInformationDto,
    examples: {
      batch: {
        summary: 'Attach multiple SI entries to multiple offerings',
        value: {
          offeringIds: [
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
          ],
          items: [
            {
              informationType: 'INSTRUCTION',
              title: 'Application instruction',
              content:
                'Complete the online application and upload required documents.',
              referenceUrl: 'https://admissions.example.edu/apply',
              mandatory: true,
              displayOrder: 1,
            },
            {
              informationType: 'FAQ',
              title: 'Fee refund policy',
              content: 'Application fees are non-refundable.',
              mandatory: false,
              displayOrder: 2,
            },
          ],
        },
      },
    },
  })
  @ApiWrappedCreatedResponse(
    SupportingInformationBatchResponseDto,
    'Supporting information created',
  )
  create(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateSupportingInformationDto,
  ): Promise<SupportingInformationBatchResponseDto> {
    return this.supportingInformationService.createForOfferings(ctx, dto);
  }

  @Patch('supporting-information/:informationId')
  @ApiOperation({ summary: 'Update supporting information' })
  @ApiParam({
    name: 'informationId',
    description: 'Supporting information UUID',
  })
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
