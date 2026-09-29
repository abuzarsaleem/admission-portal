import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiStandardErrorResponses,
  ApiWrappedCreatedResponse,
  ApiWrappedRawArrayResponse,
  ApiWrappedOkResponse,
} from '../../common/decorators/api-docs.decorator.js';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import {
  CreateOnlinePaymentDto,
  OnlinePaymentResponseDto,
  PaymentEvidenceResponseDto,
  ProcessingFeeChallanResponseDto,
  ProcessingFeePrintResponseDto,
  ProcessingFeeStatusResponseDto,
} from './dto/processing-fee.dto.js';
import {
  ProcessingFeeService,
  type PaymentUpload,
} from './processing-fee.service.js';

@ApiTags('Applicant Processing Fee')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses()
@ApiExtraModels(
  ApiErrorResponseDto,
  ProcessingFeeChallanResponseDto,
  ProcessingFeePrintResponseDto,
  ProcessingFeeStatusResponseDto,
  PaymentEvidenceResponseDto,
  CreateOnlinePaymentDto,
  OnlinePaymentResponseDto,
)
@Controller('applicants/applications/:applicantId/processing-fee')
export class ApplicantProcessingFeeController {
  constructor(private readonly service: ProcessingFeeService) {}

  @Post('challan')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'Generate processing fee challan',
    description:
      'Creates one challan after the application is submitted. Repeated requests return the existing challan and never issue a new challan number.',
  })
  @ApiWrappedCreatedResponse(ProcessingFeeChallanResponseDto)
  generateChallan(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ) {
    return this.service.generateChallan(user, applicantId);
  }

  @Get('challan')
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'Get or reprint existing challan',
    description:
      'Returns the same immutable challan and its itemised fee breakdown.',
  })
  @ApiWrappedOkResponse(ProcessingFeeChallanResponseDto)
  getChallan(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ) {
    return this.service.getChallan(user, applicantId);
  }

  @Get('challan/print')
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'Get three-copy printable challan data',
    description:
      'Returns one challan payload with copy labels APPLICANT, INSTITUTION and BANK so the client can render identical printable copies.',
  })
  @ApiWrappedOkResponse(ProcessingFeePrintResponseDto)
  printChallan(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ) {
    return this.service.challanPrint(user, applicantId);
  }

  @Post('evidence')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPG, JPEG, PNG, GIF, BMP or PDF; max 10 MB.',
        },
        onlinePaymentTransactionId: {
          type: 'string',
          format: 'uuid',
          description:
            'Set only when this receipt belongs to an applicant online payment.',
        },
      },
    },
  })
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'Upload or replace payment evidence',
    description:
      'Stores evidence privately and returns a signed download URL. Evidence remains replaceable until verified; a verified evidence record is immutable.',
  })
  @ApiWrappedCreatedResponse(PaymentEvidenceResponseDto)
  uploadEvidence(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @UploadedFile() file?: PaymentUpload,
    @Body('onlinePaymentTransactionId') onlinePaymentTransactionId?: string,
  ) {
    return this.service.uploadEvidence(
      user,
      applicantId,
      file,
      onlinePaymentTransactionId,
    );
  }

  @Get('evidence')
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'List payment evidence',
    description:
      'Returns the applicant’s evidence history with signed download URLs.',
  })
  @ApiWrappedRawArrayResponse(PaymentEvidenceResponseDto)
  listEvidence(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ) {
    return this.service.listEvidence(user, applicantId);
  }

  @Get('status')
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({ summary: 'Get processing fee payment status' })
  @ApiWrappedOkResponse(ProcessingFeeStatusResponseDto)
  status(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ) {
    return this.service.paymentStatus(user, applicantId);
  }

  @Post('payment')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'Record applicant-initiated online payment',
    description:
      'Stores provider-neutral wallet/mobile-account transaction details only. The provider processes the payment; this endpoint does not collect card or wallet credentials.',
  })
  @ApiWrappedCreatedResponse(OnlinePaymentResponseDto)
  createOnlinePayment(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateOnlinePaymentDto,
  ) {
    return this.service.createOnlinePayment(user, applicantId, dto);
  }

  @Get('payment-status')
  @ApiParam({ name: 'applicantId', format: 'uuid' })
  @ApiOperation({
    summary: 'Get latest applicant online payment status and receipt state',
  })
  @ApiWrappedOkResponse(OnlinePaymentResponseDto)
  paymentStatus(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ) {
    return this.service.applicantOnlinePayments(user, applicantId);
  }
}
