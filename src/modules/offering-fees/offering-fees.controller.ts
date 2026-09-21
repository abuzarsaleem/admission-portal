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
  CreateOfferingFeeDto,
  OfferingFeeResponseDto,
  UpdateOfferingFeeDto,
} from './dto/offering-fee.dto.js';
import { OfferingFeesService } from './offering-fees.service.js';

@ApiTags('Fee Configuration')
@ApiExtraModels(
  OfferingFeeResponseDto,
  CreateOfferingFeeDto,
  UpdateOfferingFeeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions')
export class OfferingFeesController {
  constructor(private readonly offeringFeesService: OfferingFeesService) {}

  @Post('offerings/:offeringId/fees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create/configure offering fee',
    description:
      'Attaches a fee to an editable offering. Use **one** of:\n' +
      '1) `generalFeeId` — link an existing general fee master\n' +
      '2) `feeType` + `amount` + `currency` — create a new general fee and link it\n' +
      'Do not send both.',
  })
  @ApiParam({
    name: 'offeringId',
    description: 'Offering UUID',
    example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  })
  @ApiBody({
    type: CreateOfferingFeeDto,
    examples: {
      attachExisting: {
        summary: 'Attach existing general fee',
        value: {
          generalFeeId: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
          effectiveFrom: '2026-07-01T00:00:00.000Z',
          effectiveTo: '2026-09-15T23:59:59.000Z',
          sortOrder: 1,
        },
      },
      createInline: {
        summary: 'Create fee master inline and attach',
        value: {
          feeType: 'APPLICATION',
          amount: 2500,
          currency: 'PKR',
          effectiveFrom: '2026-07-01T00:00:00.000Z',
          effectiveTo: '2026-09-15T23:59:59.000Z',
          sortOrder: 1,
        },
      },
    },
  })
  @ApiWrappedCreatedResponse(OfferingFeeResponseDto, 'Offering fee created')
  createForOffering(
    @ReqContext() ctx: RequestContext,
    @Param('offeringId', new ParseUuidPipe('offeringId')) offeringId: string,
    @Body() dto: CreateOfferingFeeDto,
  ): Promise<OfferingFeeResponseDto> {
    return this.offeringFeesService.createForOffering(ctx, offeringId, dto);
  }

  @Patch('fees/:feeConfigurationId')
  @ApiOperation({
    summary: 'Update fee configuration',
    description:
      'Updates amount/currency/status and/or effective window for an offering fee configuration. ' +
      'At least one field is required. Allowed only while the parent offering/intake remain editable.',
  })
  @ApiParam({
    name: 'feeConfigurationId',
    description: 'Fee configuration UUID (offering_fees.id)',
    example: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  })
  @ApiWrappedOkResponse(OfferingFeeResponseDto, 'Fee configuration updated')
  update(
    @ReqContext() ctx: RequestContext,
    @Param('feeConfigurationId', new ParseUuidPipe('feeConfigurationId'))
    feeConfigurationId: string,
    @Body() dto: UpdateOfferingFeeDto,
  ): Promise<OfferingFeeResponseDto> {
    return this.offeringFeesService.update(ctx, feeConfigurationId, dto);
  }
}
