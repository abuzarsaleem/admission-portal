import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  ApiWrappedOkResponse,
} from '../../common/decorators/api-docs.decorator.js';
import {
  ReqContext,
  type RequestContext,
} from '../../common/decorators/request-context.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { IntakeResponseDto } from './dto/intake-response.dto.js';
import {
  IntakeReviewPackageDto,
  IntakeWorkflowResponseDto,
  PublicationReadinessDto,
  PublicationReadinessIssueDto,
  ReturnIntakeDto,
} from './dto/intake-workflow.dto.js';
import { IntakeWorkflowService } from './intake-workflow.service.js';

@ApiTags('Intake Review & Publication')
@ApiExtraModels(
  IntakeResponseDto,
  IntakeReviewPackageDto,
  IntakeWorkflowResponseDto,
  PublicationReadinessDto,
  PublicationReadinessIssueDto,
  ReturnIntakeDto,
  ApiErrorResponseDto,
)
@ApiTenantHeaders()
@ApiStandardErrorResponses()
@Controller('admissions/intakes')
export class IntakeWorkflowController {
  constructor(private readonly workflowService: IntakeWorkflowService) {}

  @Post(':intakeId/submit-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit intake for review',
    description:
      'Transitions DRAFT/CONFIGURED → UNDER_REVIEW when publication readiness checks pass.',
  })
  @ApiParam({ name: 'intakeId', description: 'Intake UUID' })
  @ApiWrappedOkResponse(IntakeWorkflowResponseDto, 'Intake submitted for review')
  submitForReview(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
  ): Promise<IntakeWorkflowResponseDto> {
    return this.workflowService.submitForReview(ctx, intakeId);
  }

  @Get(':intakeId/review')
  @ApiOperation({
    summary: 'Get intake review package',
    description:
      'Returns intake details, per-offering configuration summary, and publication readiness.',
  })
  @ApiParam({ name: 'intakeId', description: 'Intake UUID' })
  @ApiWrappedOkResponse(IntakeReviewPackageDto, 'Intake review package')
  getReview(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
  ): Promise<IntakeReviewPackageDto> {
    return this.workflowService.getReviewPackage(ctx, intakeId);
  }

  @Post(':intakeId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish intake',
    description:
      'Transitions UNDER_REVIEW → PUBLISHED and publishes all associated offerings.',
  })
  @ApiParam({ name: 'intakeId', description: 'Intake UUID' })
  @ApiWrappedOkResponse(IntakeWorkflowResponseDto, 'Intake published')
  publish(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
  ): Promise<IntakeWorkflowResponseDto> {
    return this.workflowService.publish(ctx, intakeId);
  }

  @Post(':intakeId/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return intake for correction',
    description: 'Transitions UNDER_REVIEW → CONFIGURED with an optional reason.',
  })
  @ApiParam({ name: 'intakeId', description: 'Intake UUID' })
  @ApiWrappedOkResponse(IntakeWorkflowResponseDto, 'Intake returned for correction')
  returnForCorrection(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
    @Body() dto: ReturnIntakeDto,
  ): Promise<IntakeWorkflowResponseDto> {
    return this.workflowService.returnForCorrection(ctx, intakeId, dto);
  }

  @Post(':intakeId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close intake',
    description: 'Transitions PUBLISHED → CLOSED and closes associated offerings.',
  })
  @ApiParam({ name: 'intakeId', description: 'Intake UUID' })
  @ApiWrappedOkResponse(IntakeWorkflowResponseDto, 'Intake closed')
  close(
    @ReqContext() ctx: RequestContext,
    @Param('intakeId', new ParseUuidPipe('intakeId')) intakeId: string,
  ): Promise<IntakeWorkflowResponseDto> {
    return this.workflowService.close(ctx, intakeId);
  }
}
