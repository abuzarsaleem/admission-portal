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
  CreateOfferingFeeItemDto,
  OfferingFeeBatchResponseDto,
  OfferingFeeResponseDto,
  UpdateOfferingFeeDto,
} from './dto/offering-fee.dto.js';
import { OfferingFeesService } from './offering-fees.service.js';

@ApiTags('Fee Configuration')
@ApiExtraModels(
  OfferingFeeResponseDto,
  OfferingFeeBatchResponseDto,
  CreateOfferingFeeDto,
  CreateOfferingFeeItemDto,
  UpdateOfferingFeeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions')
export class OfferingFeesController {
  constructor(private readonly offeringFeesService: OfferingFeesService) {}

  @Post('offerings/fees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create/configure offering fee(s)',
    description:
      'Attaches one or more fees (`fees[]`) to one or more editable offerings (`offeringIds`). ' +
      'Each fee item uses **one** of:\n' +
      '1) `generalFeeId` — link an existing general fee master\n' +
      '2) `feeType` + `amount` + `currency` — create a new general fee and link it\n' +
      'Do not send both on the same item.',
  })
  @ApiBody({
    type: CreateOfferingFeeDto,
    examples: {
      attachExisting: {
        summary: 'Attach multiple existing fees to offerings',
        value: {
          offeringIds: [
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
          ],
          fees: [
            {
              generalFeeId: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
              effectiveFrom: '2026-07-01T00:00:00.000Z',
              effectiveTo: '2026-09-15T23:59:59.000Z',
              sortOrder: 1,
            },
            {
              generalFeeId: 'ffffffff-ffff-4fff-8fff-fffffffffff2',
              sortOrder: 2,
            },
          ],
        },
      },
      createInline: {
        summary: 'Create fee masters inline and attach',
        value: {
          offeringIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'],
          fees: [
            {
              feeType: 'APPLICATION',
              amount: 2500,
              currency: 'PKR',
              sortOrder: 1,
            },
          ],
        },
      },
    },
  })
  @ApiWrappedCreatedResponse(
    OfferingFeeBatchResponseDto,
    'Offering fee(s) created',
  )
  createForOfferings(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateOfferingFeeDto,
  ): Promise<OfferingFeeBatchResponseDto> {
    return this.offeringFeesService.createForOfferings(ctx, dto);
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
