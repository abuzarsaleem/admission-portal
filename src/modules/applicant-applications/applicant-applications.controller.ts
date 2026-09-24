import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
  ApiWrappedOkArrayResponse,
  ApiWrappedOkResponse,
} from '../../common/decorators/api-docs.decorator.js';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { AcademicDocumentType } from '../../common/enums/application-completion.enum.js';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe.js';
import { ApplicantApplicationsService } from './applicant-applications.service.js';
import type { UploadedFileInput } from './applicant-applications.service.js';
import {
  AcademicDocumentResponseDto,
  AcademicStepResponseDto,
  ApplicationAddressResponseDto,
  ApplicationContactResponseDto,
  CreateAcademicDto,
  CreateAddressesDto,
  CreateContactsDto,
  CreateDeclarationDto,
  CreateProgrammeDto,
  CreateProfileDto,
  DeclarationStepResponseDto,
  ProgrammeStepResponseDto,
  ProfilePhotographResponseDto,
  ProfileStepResponseDto,
  SubmitApplicationResponseDto,
  UpdateAcademicDto,
  UpdateAddressesDto,
  UpdateContactsDto,
  UpdateDeclarationDto,
  UpdateProgrammeDto,
  UpdateProfileDto,
} from './dto/applicant-application.dto.js';

@ApiTags('Applicants Applications')
@ApiBearerAuth()
@ApiExtraModels(
  AcademicStepResponseDto,
  AcademicDocumentResponseDto,
  ProfilePhotographResponseDto,
  CreateAcademicDto,
  UpdateAcademicDto,
  CreateProgrammeDto,
  UpdateProgrammeDto,
  CreateProfileDto,
  UpdateProfileDto,
  CreateAddressesDto,
  UpdateAddressesDto,
  CreateContactsDto,
  UpdateContactsDto,
  CreateDeclarationDto,
  UpdateDeclarationDto,
  ProgrammeStepResponseDto,
  ProfileStepResponseDto,
  ApplicationAddressResponseDto,
  ApplicationContactResponseDto,
  DeclarationStepResponseDto,
  SubmitApplicationResponseDto,
  ApiErrorResponseDto,
)
@ApiStandardErrorResponses()
@ApiParam({ name: 'applicantId', description: 'Application UUID (applicant_id)' })
@Controller('applicants/applications/:applicantId')
export class ApplicantApplicationsController {
  constructor(
    private readonly applicationsService: ApplicantApplicationsService,
  ) {}

  @Get('academic')
  @ApiOperation({ summary: 'Get academic information and documents' })
  @ApiWrappedOkResponse(AcademicStepResponseDto, 'Academic step')
  getAcademic(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<AcademicStepResponseDto> {
    return this.applicationsService.getAcademic(user, applicantId);
  }

  @Post('academic')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create academic information' })
  @ApiWrappedCreatedResponse(AcademicStepResponseDto, 'Academic records created')
  createAcademic(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateAcademicDto,
  ): Promise<AcademicStepResponseDto> {
    return this.applicationsService.createAcademic(user, applicantId, dto);
  }

  @Put('academic')
  @ApiOperation({ summary: 'Update academic information' })
  @ApiWrappedOkResponse(AcademicStepResponseDto, 'Academic records updated')
  updateAcademic(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: UpdateAcademicDto,
  ): Promise<AcademicStepResponseDto> {
    return this.applicationsService.updateAcademic(user, applicantId, dto);
  }

  @Post('academic/:academicInformationId/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload academic document',
    description:
      'Multipart upload to Backblaze B2 (or local storage). Field `file` + `documentType`.',
  })
  @ApiParam({ name: 'academicInformationId', description: 'Academic record UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: {
          type: 'string',
          enum: Object.values(AcademicDocumentType),
        },
      },
    },
  })
  @ApiWrappedCreatedResponse(
    AcademicDocumentResponseDto,
    'Academic document uploaded',
  )
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Param('academicInformationId', new ParseUuidPipe('academicInformationId'))
    academicInformationId: string,
    @UploadedFile() file: UploadedFileInput,
    @Body('documentType') documentType: AcademicDocumentType,
  ): Promise<AcademicDocumentResponseDto> {
    return this.applicationsService.uploadAcademicDocument(
      user,
      applicantId,
      academicInformationId,
      documentType,
      file,
    );
  }

  @Delete('academic/:academicInformationId/documents/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove academic document before submission' })
  @ApiParam({ name: 'academicInformationId', description: 'Academic record UUID' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async deleteDocument(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Param('academicInformationId', new ParseUuidPipe('academicInformationId'))
    academicInformationId: string,
    @Param('documentId', new ParseUuidPipe('documentId')) documentId: string,
  ): Promise<{ deleted: true; id: string }> {
    await this.applicationsService.deleteAcademicDocument(
      user,
      applicantId,
      academicInformationId,
      documentId,
    );
    return { deleted: true, id: documentId };
  }

  @Get('programme')
  @ApiOperation({ summary: 'Get programme selection and preferences' })
  @ApiWrappedOkResponse(ProgrammeStepResponseDto, 'Programme step')
  getProgramme(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<ProgrammeStepResponseDto> {
    return this.applicationsService.getProgramme(user, applicantId);
  }

  @Post('programme')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create programme selection and preferences' })
  @ApiWrappedCreatedResponse(ProgrammeStepResponseDto, 'Programme created')
  createProgramme(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateProgrammeDto,
  ): Promise<ProgrammeStepResponseDto> {
    return this.applicationsService.createProgramme(user, applicantId, dto);
  }

  @Put('programme')
  @ApiOperation({ summary: 'Update programme selection and preferences' })
  @ApiWrappedOkResponse(ProgrammeStepResponseDto, 'Programme updated')
  updateProgramme(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: UpdateProgrammeDto,
  ): Promise<ProgrammeStepResponseDto> {
    return this.applicationsService.updateProgramme(user, applicantId, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get applicant profile, addresses and contacts' })
  @ApiWrappedOkResponse(ProfileStepResponseDto, 'Profile step')
  getProfile(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<ProfileStepResponseDto> {
    return this.applicationsService.getProfile(user, applicantId);
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create applicant profile' })
  @ApiWrappedCreatedResponse(ProfileStepResponseDto, 'Profile created')
  createProfile(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateProfileDto,
  ): Promise<ProfileStepResponseDto> {
    return this.applicationsService.createProfile(user, applicantId, dto);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update applicant profile' })
  @ApiWrappedOkResponse(ProfileStepResponseDto, 'Profile updated')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileStepResponseDto> {
    return this.applicationsService.updateProfile(user, applicantId, dto);
  }

  @Post('profile/photograph')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload profile photograph',
    description:
      'Multipart image upload (JPEG/PNG/WEBP, max 5MB) to Backblaze B2. Updates `profilePhotograph` on the application.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiWrappedCreatedResponse(
    ProfilePhotographResponseDto,
    'Profile photograph uploaded',
  )
  @UseInterceptors(FileInterceptor('file'))
  uploadPhotograph(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @UploadedFile() file: UploadedFileInput,
  ): Promise<ProfilePhotographResponseDto> {
    return this.applicationsService.uploadProfilePhotograph(
      user,
      applicantId,
      file,
    );
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get application addresses' })
  @ApiWrappedOkArrayResponse(ApplicationAddressResponseDto, 'Addresses')
  getAddresses(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<ApplicationAddressResponseDto[]> {
    return this.applicationsService.getAddresses(user, applicantId);
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create application addresses' })
  @ApiWrappedCreatedResponse(ApplicationAddressResponseDto, 'Addresses created')
  createAddresses(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateAddressesDto,
  ): Promise<ApplicationAddressResponseDto[]> {
    return this.applicationsService.createAddresses(user, applicantId, dto);
  }

  @Put('addresses')
  @ApiOperation({ summary: 'Update application addresses' })
  @ApiWrappedOkArrayResponse(ApplicationAddressResponseDto, 'Addresses updated')
  updateAddresses(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: UpdateAddressesDto,
  ): Promise<ApplicationAddressResponseDto[]> {
    return this.applicationsService.updateAddresses(user, applicantId, dto);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get parent/guardian/emergency contacts' })
  @ApiWrappedOkArrayResponse(ApplicationContactResponseDto, 'Contacts')
  getContacts(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<ApplicationContactResponseDto[]> {
    return this.applicationsService.getContacts(user, applicantId);
  }

  @Post('contacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create parent/guardian/emergency contacts' })
  @ApiWrappedCreatedResponse(ApplicationContactResponseDto, 'Contacts created')
  createContacts(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateContactsDto,
  ): Promise<ApplicationContactResponseDto[]> {
    return this.applicationsService.createContacts(user, applicantId, dto);
  }

  @Put('contacts')
  @ApiOperation({ summary: 'Update parent/guardian/emergency contacts' })
  @ApiWrappedOkArrayResponse(ApplicationContactResponseDto, 'Contacts updated')
  updateContacts(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: UpdateContactsDto,
  ): Promise<ApplicationContactResponseDto[]> {
    return this.applicationsService.updateContacts(user, applicantId, dto);
  }

  @Get('declaration')
  @ApiOperation({ summary: 'Get declaration' })
  @ApiWrappedOkResponse(DeclarationStepResponseDto, 'Declaration step')
  getDeclaration(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<DeclarationStepResponseDto> {
    return this.applicationsService.getDeclaration(user, applicantId);
  }

  @Post('declaration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create declaration' })
  @ApiWrappedCreatedResponse(DeclarationStepResponseDto, 'Declaration created')
  createDeclaration(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: CreateDeclarationDto,
  ): Promise<DeclarationStepResponseDto> {
    return this.applicationsService.createDeclaration(user, applicantId, dto);
  }

  @Put('declaration')
  @ApiOperation({ summary: 'Update declaration' })
  @ApiWrappedOkResponse(DeclarationStepResponseDto, 'Declaration updated')
  updateDeclaration(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
    @Body() dto: UpdateDeclarationDto,
  ): Promise<DeclarationStepResponseDto> {
    return this.applicationsService.updateDeclaration(user, applicantId, dto);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit completed application' })
  @ApiWrappedOkResponse(SubmitApplicationResponseDto, 'Application submitted')
  submit(
    @CurrentUser() user: AuthUser,
    @Param('applicantId', new ParseUuidPipe('applicantId')) applicantId: string,
  ): Promise<SubmitApplicationResponseDto> {
    return this.applicationsService.submit(user, applicantId);
  }
}
