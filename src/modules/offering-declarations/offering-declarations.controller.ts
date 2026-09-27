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
  CreateOfferingDeclarationDto,
  CreateOfferingDeclarationItemDto,
  OfferingDeclarationBatchResponseDto,
  OfferingDeclarationResponseDto,
  UpdateOfferingDeclarationDto,
} from './dto/offering-declaration.dto.js';
import { OfferingDeclarationsService } from './offering-declarations.service.js';

@ApiTags('Offering Declarations')
@ApiExtraModels(
  OfferingDeclarationResponseDto,
  OfferingDeclarationBatchResponseDto,
  CreateOfferingDeclarationDto,
  CreateOfferingDeclarationItemDto,
  UpdateOfferingDeclarationDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions')
export class OfferingDeclarationsController {
  constructor(
    private readonly offeringDeclarationsService: OfferingDeclarationsService,
  ) {}

  @Get('offerings/:offeringId/declarations')
  @ApiOperation({
    summary: 'List declarations for an offering',
    description:
      'Returns all offering declarations (admin view; includes all statuses).',
  })
  @ApiParam({
    name: 'offeringId',
    description: 'Offering UUID',
    example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  })
  @ApiWrappedOkResponse(
    OfferingDeclarationBatchResponseDto,
    'Offering declarations for offering',
  )
  listByOffering(
    @ReqContext() ctx: RequestContext,
    @Param('offeringId', new ParseUuidPipe('offeringId')) offeringId: string,
  ): Promise<OfferingDeclarationBatchResponseDto> {
    return this.offeringDeclarationsService.listByOffering(ctx, offeringId);
  }

  @Post('offerings/declarations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create/configure offering declaration(s)',
    description:
      'Attaches one or more declarations (`declarations[]`) to one or more editable offerings (`offeringIds`). ' +
      'Each item uses **one** of:\n' +
      '1) `generalDeclarationId` — clone an existing ACTIVE general declaration\n' +
      '2) `declarationTypeId` + `declarationText` + `version` + `effectiveFrom` — create inline\n' +
      'Do not send both on the same item.',
  })
  @ApiBody({
    type: CreateOfferingDeclarationDto,
    examples: {
      cloneExisting: {
        summary: 'Clone existing general declarations onto offerings',
        value: {
          offeringIds: [
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
          ],
          declarations: [
            {
              generalDeclarationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
            },
            {
              generalDeclarationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
              effectiveFrom: '2026-07-01T00:00:00.000Z',
              effectiveTo: '2026-12-31T23:59:59.000Z',
            },
          ],
        },
      },
      createInline: {
        summary: 'Create declarations inline and attach',
        value: {
          offeringIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'],
          declarations: [
            {
              declarationTypeId: '33333333-3333-4333-8333-333333333001',
              declarationText:
                'I hereby declare that all information provided is true and correct.',
              version: '1.0',
              effectiveFrom: '2026-07-01T00:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiWrappedCreatedResponse(
    OfferingDeclarationBatchResponseDto,
    'Offering declaration(s) created',
  )
  createForOfferings(
    @ReqContext() ctx: RequestContext,
    @Body() dto: CreateOfferingDeclarationDto,
  ): Promise<OfferingDeclarationBatchResponseDto> {
    return this.offeringDeclarationsService.createForOfferings(ctx, dto);
  }

  @Patch('declarations/:offeringDeclarationId')
  @ApiOperation({
    summary: 'Update offering declaration',
    description:
      'Updates text/version/status and/or effective window. ' +
      'Allowed only while the parent offering/intake remain editable.',
  })
  @ApiParam({
    name: 'offeringDeclarationId',
    description: 'Offering declaration UUID (offering_declarations.id)',
    example: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  })
  @ApiWrappedOkResponse(
    OfferingDeclarationResponseDto,
    'Offering declaration updated',
  )
  update(
    @ReqContext() ctx: RequestContext,
    @Param('offeringDeclarationId', new ParseUuidPipe('offeringDeclarationId'))
    offeringDeclarationId: string,
    @Body() dto: UpdateOfferingDeclarationDto,
  ): Promise<OfferingDeclarationResponseDto> {
    return this.offeringDeclarationsService.update(
      ctx,
      offeringDeclarationId,
      dto,
    );
  }
}
