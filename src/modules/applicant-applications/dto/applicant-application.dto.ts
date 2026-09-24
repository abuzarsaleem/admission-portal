import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  AcademicDocumentType,
  ApplicationAddressType,
  ApplicationContactType,
  QualificationLevel,
} from '../../../common/enums/application-completion.enum.js';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/* ── Academic ─────────────────────────────────────────────────────── */

export class AcademicRecordFieldsDto {
  @ApiProperty({ example: 'FSC' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  degreeType!: string;

  @ApiProperty({ example: 'FSC Pre-Engineering' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  qualificationName!: string;

  @ApiProperty({ example: 'Board of Intermediate & Secondary Education Lahore' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  boardOrInstitution!: string;

  @ApiProperty({ example: '2025' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  passingYear!: string;

  @ApiProperty({ example: '1st' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  division!: string;

  @ApiProperty({ example: 'A' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  grade!: string;

  @ApiProperty({ example: '875' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  marksOrGpaObtained!: string;

  @ApiProperty({ example: '1100' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  marksOrGpaTotal!: string;

  @ApiProperty({ example: 79.55 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage!: number;
}

/** POST body — create new academic records (no ids). */
export class CreateAcademicDto {
  @ApiProperty({ type: [AcademicRecordFieldsDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AcademicRecordFieldsDto)
  records!: AcademicRecordFieldsDto[];
}

export class UpdateAcademicRecordDto extends AcademicRecordFieldsDto {
  @ApiProperty({ description: 'Existing academic record UUID' })
  @IsUUID('4')
  id!: string;
}

/** PUT body — update existing academic records (ids required). */
export class UpdateAcademicDto {
  @ApiProperty({ type: [UpdateAcademicRecordDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAcademicRecordDto)
  records!: UpdateAcademicRecordDto[];
}

export class CreateAcademicDocumentDto {
  @ApiProperty({ enum: AcademicDocumentType })
  @IsEnum(AcademicDocumentType)
  documentType!: AcademicDocumentType;
}

export class ProfilePhotographResponseDto {
  @ApiProperty()
  applicantId!: string;

  @ApiProperty({ description: 'Durable storage URL saved on the application' })
  profilePhotograph!: string;

  @ApiProperty({ description: 'Immediately usable download URL (may be signed)' })
  downloadUrl!: string;
}

export class AcademicDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  academicInformationId!: string;

  @ApiProperty({ enum: AcademicDocumentType })
  documentType!: AcademicDocumentType;

  @ApiProperty()
  fileReference!: string;

  @ApiPropertyOptional({ nullable: true })
  originalFileName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fileSize!: number | null;

  @ApiProperty()
  uploadedAt!: Date;

  @ApiProperty()
  verificationStatus!: string;
}

export class AcademicRecordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  degreeType!: string;

  @ApiProperty()
  qualificationName!: string;

  @ApiProperty()
  boardOrInstitution!: string;

  @ApiProperty()
  passingYear!: string;

  @ApiProperty()
  division!: string;

  @ApiProperty()
  grade!: string;

  @ApiProperty()
  marksOrGpaObtained!: string;

  @ApiProperty()
  marksOrGpaTotal!: string;

  @ApiProperty()
  percentage!: number;

  @ApiProperty({ type: [AcademicDocumentResponseDto] })
  documents!: AcademicDocumentResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AcademicStepResponseDto {
  @ApiProperty()
  applicantId!: string;

  @ApiProperty()
  academicStepSaved!: boolean;

  @ApiProperty()
  overallCompletion!: number;

  @ApiProperty({ type: [AcademicRecordResponseDto] })
  records!: AcademicRecordResponseDto[];
}

/* ── Programme ────────────────────────────────────────────────────── */

export class ProgrammeOptionDto {
  @ApiProperty({ description: 'Published programme offering UUID' })
  @IsUUID('4')
  programmeOfferingId!: string;

  @ApiProperty({ description: '1 = mandatory preference, 2 = optional', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  preferenceOrder!: number;
}

export class CreateProgrammeDto {
  @ApiProperty({ enum: QualificationLevel })
  @IsEnum(QualificationLevel)
  qualificationLevel!: QualificationLevel;

  @ApiProperty({ type: [ProgrammeOptionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => ProgrammeOptionDto)
  options!: ProgrammeOptionDto[];
}

export class UpdateProgrammeDto extends CreateProgrammeDto {}

export class ProgrammeOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  programmeOfferingId!: string;

  @ApiProperty()
  preferenceOrder!: number;
}

export class ProgrammeStepResponseDto {
  @ApiProperty()
  applicantId!: string;

  @ApiProperty()
  intakeSessionId!: string;

  @ApiPropertyOptional({ enum: QualificationLevel, nullable: true })
  qualificationLevel!: QualificationLevel | null;

  @ApiPropertyOptional({ nullable: true })
  appliedDate!: Date | null;

  @ApiProperty()
  stepSaved!: boolean;

  @ApiPropertyOptional({ nullable: true })
  savedAt!: Date | null;

  @ApiProperty({ type: [ProgrammeOptionResponseDto] })
  options!: ProgrammeOptionResponseDto[];

  @ApiProperty()
  programmeStepSaved!: boolean;

  @ApiProperty()
  overallCompletion!: number;
}

/* ── Addresses ────────────────────────────────────────────────────── */

export class AddressFieldsDto {
  @ApiProperty({ enum: ApplicationAddressType })
  @IsEnum(ApplicationAddressType)
  addressType!: ApplicationAddressType;

  @ApiProperty({ example: 'House 25, Street 12, Johar Town' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({ example: 'PK' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  countryId!: string;

  @ApiProperty({ example: 'PK-PB' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  provinceId!: string;

  @ApiProperty({ example: 'PK-PB-LHE' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  cityId!: string;

  @ApiPropertyOptional({ example: '54782' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSameAsPrimary?: boolean;
}

export class CreateAddressesDto {
  @ApiProperty({ type: [AddressFieldsDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddressFieldsDto)
  addresses!: AddressFieldsDto[];
}

export class UpdateAddressDto extends AddressFieldsDto {
  @ApiProperty()
  @IsUUID('4')
  id!: string;
}

export class UpdateAddressesDto {
  @ApiProperty({ type: [UpdateAddressDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAddressDto)
  addresses!: UpdateAddressDto[];
}

export class ApplicationAddressResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ApplicationAddressType })
  addressType!: ApplicationAddressType;

  @ApiProperty()
  addressLine1!: string;

  @ApiPropertyOptional({ nullable: true })
  addressLine2!: string | null;

  @ApiProperty()
  countryId!: string;

  @ApiProperty()
  provinceId!: string;

  @ApiProperty()
  cityId!: string;

  @ApiPropertyOptional({ nullable: true })
  postalCode!: string | null;

  @ApiProperty()
  isSameAsPrimary!: boolean;
}

/* ── Contacts ─────────────────────────────────────────────────────── */

export class ContactFieldsDto {
  @ApiProperty({ enum: ApplicationContactType })
  @IsEnum(ApplicationContactType)
  contactType!: ApplicationContactType;

  @ApiProperty({ example: 'Muhammad Aslam' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: '35202-7654321-1' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  identityDocumentNumber?: string;

  @ApiProperty({ example: 'FATHER' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  relationship!: string;

  @ApiPropertyOptional({ example: 'Business' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiProperty({ example: '+923007654321' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  mobileNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(30)
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  addressLine?: string;
}

export class CreateContactsDto {
  @ApiProperty({ type: [ContactFieldsDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ContactFieldsDto)
  contacts!: ContactFieldsDto[];
}

export class UpdateContactDto extends ContactFieldsDto {
  @ApiProperty()
  @IsUUID('4')
  id!: string;
}

export class UpdateContactsDto {
  @ApiProperty({ type: [UpdateContactDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateContactDto)
  contacts!: UpdateContactDto[];
}

export class ApplicationContactResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ApplicationContactType })
  contactType!: ApplicationContactType;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  identityDocumentNumber!: string | null;

  @ApiProperty()
  relationship!: string;

  @ApiPropertyOptional({ nullable: true })
  occupation!: string | null;

  @ApiProperty()
  mobileNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  telephone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  addressLine!: string | null;
}

/* ── Profile ──────────────────────────────────────────────────────── */

export class ProfileFieldsDto {
  @ApiProperty({ example: 'Muhammad Ahmed' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  applicantName!: string;

  @ApiProperty({ example: 'MALE' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender!: string;

  @ApiProperty({ example: 'SINGLE' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  maritalStatus!: string;

  @ApiProperty({ example: '2005-04-12' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: '+923001234567' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  mobileNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(30)
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  profilePhotograph?: string;

  @ApiProperty({ example: 'PK' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  primaryNationalityId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(10)
  secondaryNationalityId?: string;

  @ApiPropertyOptional({ example: 'PK-PB-LHE' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  domicileId?: string;

  @ApiProperty()
  @IsBoolean()
  disabilityDeclared!: boolean;

  @ApiPropertyOptional({ example: 'FRIEND' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  referralSource?: string;
}

export class CreateProfileDto extends ProfileFieldsDto {
  @ApiProperty({ type: [AddressFieldsDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddressFieldsDto)
  addresses!: AddressFieldsDto[];

  @ApiProperty({ type: [ContactFieldsDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ContactFieldsDto)
  contacts!: ContactFieldsDto[];
}

export class UpdateProfileDto extends ProfileFieldsDto {
  @ApiProperty({ type: [UpdateAddressDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateAddressDto)
  addresses!: UpdateAddressDto[];

  @ApiProperty({ type: [UpdateContactDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateContactDto)
  contacts!: UpdateContactDto[];
}

export class ProfileStepResponseDto {
  @ApiProperty()
  applicantId!: string;

  @ApiProperty()
  applicantName!: string;

  @ApiPropertyOptional({ nullable: true })
  gender!: string | null;

  @ApiPropertyOptional({ nullable: true })
  maritalStatus!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth!: string | null;

  @ApiProperty()
  mobileNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  telephone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  profilePhotograph!: string | null;

  @ApiPropertyOptional({ nullable: true })
  primaryNationalityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  secondaryNationalityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  domicileId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  disabilityDeclared!: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  referralSource!: string | null;

  @ApiProperty({ type: [ApplicationAddressResponseDto] })
  addresses!: ApplicationAddressResponseDto[];

  @ApiProperty({ type: [ApplicationContactResponseDto] })
  contacts!: ApplicationContactResponseDto[];

  @ApiProperty()
  profileStepSaved!: boolean;

  @ApiProperty()
  overallCompletion!: number;
}

/* ── Declaration / Submit ─────────────────────────────────────────── */

export class CreateDeclarationDto {
  @ApiProperty()
  @IsBoolean()
  declarationAccepted!: boolean;

  @ApiPropertyOptional({ example: 'DECL-1.0' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  declarationVersion?: string;

  @ApiProperty()
  @IsBoolean()
  disciplinaryIssueDeclared!: boolean;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateDeclarationDto) => o.disciplinaryIssueDeclared === true)
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  disciplinaryIssueDetails?: string;

  @ApiProperty({ example: 'TC-LHR-001' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  selectedTestCentreId!: string;
}

export class UpdateDeclarationDto extends CreateDeclarationDto {}

export class DeclarationStepResponseDto {
  @ApiProperty()
  applicantId!: string;

  @ApiProperty()
  declarationAccepted!: boolean;

  @ApiPropertyOptional({ nullable: true })
  declarationAcceptanceDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  declarationVersion!: string | null;

  @ApiProperty()
  disciplinaryIssueDeclared!: boolean;

  @ApiPropertyOptional({ nullable: true })
  disciplinaryIssueDetails!: string | null;

  @ApiPropertyOptional({ nullable: true })
  selectedTestCentreId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  submissionDate!: Date | null;

  @ApiProperty()
  declarationStepSaved!: boolean;

  @ApiProperty()
  overallCompletion!: number;

  @ApiProperty()
  applicationStatus!: string;
}

export class SubmitApplicationResponseDto {
  @ApiProperty()
  applicantId!: string;

  @ApiProperty()
  applicationStatus!: string;

  @ApiProperty()
  overallCompletion!: number;

  @ApiProperty()
  submissionDate!: Date;
}
