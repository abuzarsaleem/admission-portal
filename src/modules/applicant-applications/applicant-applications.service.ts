import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import {
  AcademicDocumentType,
  AcademicDocumentVerificationStatus,
  ApplicationAddressType,
  ApplicationContactType,
} from '../../common/enums/application-completion.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { OfferingStatus } from '../../common/enums/offering-status.enum.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { ApplicationAcademicDocumentEntity } from '../../database/entities/application-academic-document.entity.js';
import { ApplicationAcademicInformationEntity } from '../../database/entities/application-academic-information.entity.js';
import { ApplicationAddressEntity } from '../../database/entities/application-address.entity.js';
import { ApplicationContactEntity } from '../../database/entities/application-contact.entity.js';
import { ApplicationDeclarationEntity } from '../../database/entities/application-declaration.entity.js';
import { ApplicationProgrammeOptionEntity } from '../../database/entities/application-programme-options.entity.js';
import { ApplicationProgrammeSelectionEntity } from '../../database/entities/application-programme-selection.entity.js';
import { ApplicationEntity } from '../../database/entities/application.entity.js';
import { ProgrammeOfferingEntity } from '../../database/entities/programme-offering.entity.js';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../integrations/storage/object-storage.interface.js';
import type {
  AcademicDocumentResponseDto,
  AcademicRecordResponseDto,
  AcademicStepResponseDto,
  AddressFieldsDto,
  ApplicationAddressResponseDto,
  ApplicationContactResponseDto,
  ContactFieldsDto,
  CreateAcademicDto,
  CreateAddressesDto,
  CreateContactsDto,
  CreateDeclarationDto,
  CreateProgrammeDto,
  CreateProfileDto,
  DeclarationStepResponseDto,
  ProgrammeStepResponseDto,
  ProfileFieldsDto,
  ProfilePhotographResponseDto,
  ProfileStepResponseDto,
  SubmitApplicationResponseDto,
  UpdateAcademicDto,
  UpdateAddressDto,
  UpdateAddressesDto,
  UpdateContactDto,
  UpdateContactsDto,
  UpdateDeclarationDto,
  UpdateProgrammeDto,
  UpdateProfileDto,
} from './dto/applicant-application.dto.js';

export type UploadedFileInput = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const BLOOD_RELATIONS = new Set([
  'MOTHER',
  'BROTHER',
  'SISTER',
  'UNCLE',
  'AUNT',
  'GRANDFATHER',
  'GRANDMOTHER',
  'COUSIN',
]);

const BLOCKED_EMERGENCY_RELATIONS = new Set(['FATHER', 'GUARDIAN']);

const PROFILE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ACADEMIC_DOC_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class ApplicantApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationsRepo: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationAcademicInformationEntity)
    private readonly academicInfoRepo: Repository<ApplicationAcademicInformationEntity>,
    @InjectRepository(ApplicationAcademicDocumentEntity)
    private readonly academicDocsRepo: Repository<ApplicationAcademicDocumentEntity>,
    @InjectRepository(ApplicationProgrammeSelectionEntity)
    private readonly programmeSelectionRepo: Repository<ApplicationProgrammeSelectionEntity>,
    @InjectRepository(ApplicationProgrammeOptionEntity)
    private readonly programmeOptionsRepo: Repository<ApplicationProgrammeOptionEntity>,
    @InjectRepository(ApplicationAddressEntity)
    private readonly addressesRepo: Repository<ApplicationAddressEntity>,
    @InjectRepository(ApplicationContactEntity)
    private readonly contactsRepo: Repository<ApplicationContactEntity>,
    @InjectRepository(ApplicationDeclarationEntity)
    private readonly declarationsRepo: Repository<ApplicationDeclarationEntity>,
    @InjectRepository(ProgrammeOfferingEntity)
    private readonly offeringsRepo: Repository<ProgrammeOfferingEntity>,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
    private readonly dataSource: DataSource,
  ) {}

  /* ── Academic ──────────────────────────────────────────────────── */

  async getAcademic(
    user: AuthUser,
    applicantId: string,
  ): Promise<AcademicStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId, false);
    const records = await this.academicInfoRepo.find({
      where: { applicantId, tenantId: app.tenantId },
      relations: { documents: true },
      order: { createdAt: 'ASC' },
    });
    return {
      applicantId,
      academicStepSaved: app.academicStepSaved,
      overallCompletion: app.overallCompletion,
      records: records.map((r) => this.toAcademicRecord(r)),
    };
  }

  async createAcademic(
    user: AuthUser,
    applicantId: string,
    dto: CreateAcademicDto,
  ): Promise<AcademicStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);

    await this.dataSource.transaction(async (manager) => {
      const infoRepo = manager.getRepository(
        ApplicationAcademicInformationEntity,
      );
      const appsRepo = manager.getRepository(ApplicationEntity);

      await infoRepo.save(
        dto.records.map((record) =>
          infoRepo.create({
            tenantId: app.tenantId,
            applicantId,
            ...this.mapAcademicFields(record),
          }),
        ),
      );

      await appsRepo.update(applicantId, {
        academicStepSaved: true,
        applicationStatus: this.inProgressStatus(app),
        overallCompletion: this.completionPercent({
          ...app,
          academicStepSaved: true,
        }),
      });
    });

    return this.getAcademic(user, applicantId);
  }

  async updateAcademic(
    user: AuthUser,
    applicantId: string,
    dto: UpdateAcademicDto,
  ): Promise<AcademicStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);

    const ids = dto.records.map((r) => r.id);
    if (new Set(ids).size !== ids.length) {
      throw new BusinessException(
        'Duplicate academic record ids in request',
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_ACADEMIC_ID',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const infoRepo = manager.getRepository(
        ApplicationAcademicInformationEntity,
      );
      const appsRepo = manager.getRepository(ApplicationEntity);

      const existing = await infoRepo.find({
        where: { id: In(ids), applicantId, tenantId: app.tenantId },
      });
      if (existing.length !== ids.length) {
        const found = new Set(existing.map((e) => e.id));
        const missing = ids.find((id) => !found.has(id));
        throw new BusinessException(
          `Academic record ${missing} not found`,
          HttpStatus.NOT_FOUND,
          'ACADEMIC_RECORD_NOT_FOUND',
        );
      }

      const byId = new Map(existing.map((e) => [e.id, e]));
      for (const record of dto.records) {
        const row = byId.get(record.id)!;
        Object.assign(row, this.mapAcademicFields(record));
        await infoRepo.save(row);
      }

      await appsRepo.update(applicantId, {
        academicStepSaved: true,
        applicationStatus: this.inProgressStatus(app),
        overallCompletion: this.completionPercent({
          ...app,
          academicStepSaved: true,
        }),
      });
    });

    return this.getAcademic(user, applicantId);
  }

  async uploadProfilePhotograph(
    user: AuthUser,
    applicantId: string,
    file: UploadedFileInput | undefined,
  ): Promise<ProfilePhotographResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertProfileImage(file);

    const stored = await this.objectStorage.upload({
      buffer: file!.buffer,
      mimeType: file!.mimetype,
      folder: `admissions/profile-photos/${applicantId}`,
      fileName: file!.originalname,
    });

    if (app.profilePhotograph) {
      await this.safeDeleteStored(app.profilePhotograph);
    }

    await this.applicationsRepo.update(applicantId, {
      profilePhotograph: stored.publicUrl,
    });

    return {
      applicantId,
      profilePhotograph: stored.publicUrl,
      downloadUrl: stored.downloadUrl,
    };
  }

  async uploadAcademicDocument(
    user: AuthUser,
    applicantId: string,
    academicInformationId: string,
    documentType: AcademicDocumentType,
    file: UploadedFileInput | undefined,
  ): Promise<AcademicDocumentResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertAcademicDocument(file);

    if (!Object.values(AcademicDocumentType).includes(documentType)) {
      throw new BusinessException(
        'Invalid documentType',
        HttpStatus.BAD_REQUEST,
        'INVALID_DOCUMENT_TYPE',
      );
    }

    const info = await this.academicInfoRepo.findOne({
      where: { id: academicInformationId, applicantId, tenantId: app.tenantId },
    });
    if (!info) {
      throw new NotFoundException('Academic information record not found');
    }

    const stored = await this.objectStorage.upload({
      buffer: file!.buffer,
      mimeType: file!.mimetype,
      folder: `admissions/academic/${applicantId}/${academicInformationId}`,
      fileName: file!.originalname,
    });

    const saved = await this.academicDocsRepo.save(
      this.academicDocsRepo.create({
        tenantId: app.tenantId,
        applicantId,
        academicInformationId,
        documentType,
        fileReference: stored.publicUrl,
        originalFileName: file!.originalname,
        mimeType: file!.mimetype,
        fileSize: file!.size,
        uploadedAt: new Date(),
        verificationStatus: AcademicDocumentVerificationStatus.UNVERIFIED,
      }),
    );
    return this.toAcademicDocument(saved);
  }

  async deleteAcademicDocument(
    user: AuthUser,
    applicantId: string,
    academicInformationId: string,
    documentId: string,
  ): Promise<void> {
    await this.requireOwnedEditable(user, applicantId);
    const doc = await this.academicDocsRepo.findOne({
      where: {
        id: documentId,
        applicantId,
        academicInformationId,
      },
    });
    if (!doc) {
      throw new NotFoundException('Academic document not found');
    }
    await this.safeDeleteStored(doc.fileReference);
    await this.academicDocsRepo.remove(doc);
  }

  private assertProfileImage(file: UploadedFileInput | undefined): void {
    if (!file) {
      throw new BusinessException(
        'Image file is required',
        HttpStatus.BAD_REQUEST,
        'FILE_REQUIRED',
      );
    }
    if (!PROFILE_IMAGE_TYPES.has(file.mimetype)) {
      throw new BusinessException(
        'Only JPEG, PNG, or WEBP images are allowed',
        HttpStatus.BAD_REQUEST,
        'INVALID_IMAGE_TYPE',
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BusinessException(
        'Image must be 5MB or smaller',
        HttpStatus.BAD_REQUEST,
        'FILE_TOO_LARGE',
      );
    }
  }

  private assertAcademicDocument(file: UploadedFileInput | undefined): void {
    if (!file) {
      throw new BusinessException(
        'Document file is required',
        HttpStatus.BAD_REQUEST,
        'FILE_REQUIRED',
      );
    }
    if (!ACADEMIC_DOC_TYPES.has(file.mimetype)) {
      throw new BusinessException(
        'Only PDF, JPEG, PNG, or WEBP documents are allowed',
        HttpStatus.BAD_REQUEST,
        'INVALID_DOCUMENT_TYPE',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BusinessException(
        'Document must be 10MB or smaller',
        HttpStatus.BAD_REQUEST,
        'FILE_TOO_LARGE',
      );
    }
  }

  private async safeDeleteStored(publicUrlOrKey: string): Promise<void> {
    try {
      await this.objectStorage.delete(publicUrlOrKey);
    } catch {
      // best-effort cleanup
    }
  }

  /* ── Programme ─────────────────────────────────────────────────── */

  async getProgramme(
    user: AuthUser,
    applicantId: string,
  ): Promise<ProgrammeStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId, false);
    const selection = await this.programmeSelectionRepo.findOne({
      where: { applicantId, tenantId: app.tenantId },
    });
    const options = await this.programmeOptionsRepo.find({
      where: { applicantId, tenantId: app.tenantId },
      order: { preferenceOrder: 'ASC' },
    });

    return {
      applicantId,
      intakeSessionId: selection?.intakeSessionId ?? app.intakeId,
      qualificationLevel: selection?.qualificationLevel ?? null,
      appliedDate: selection?.appliedDate ?? null,
      stepSaved: selection?.stepSaved ?? false,
      savedAt: selection?.savedAt ?? null,
      options: options.map((o) => ({
        id: o.id,
        programmeOfferingId: o.programmeOfferingId,
        preferenceOrder: o.preferenceOrder,
      })),
      programmeStepSaved: app.programmeStepSaved,
      overallCompletion: app.overallCompletion,
    };
  }

  async createProgramme(
    user: AuthUser,
    applicantId: string,
    dto: CreateProgrammeDto,
  ): Promise<ProgrammeStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    const existing = await this.programmeSelectionRepo.findOne({
      where: { applicantId },
    });
    if (existing) {
      throw new BusinessException(
        'Programme selection already exists; use PUT to update',
        HttpStatus.CONFLICT,
        'PROGRAMME_ALREADY_EXISTS',
      );
    }
    await this.persistProgramme(app, applicantId, dto);
    return this.getProgramme(user, applicantId);
  }

  async updateProgramme(
    user: AuthUser,
    applicantId: string,
    dto: UpdateProgrammeDto,
  ): Promise<ProgrammeStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    const existing = await this.programmeSelectionRepo.findOne({
      where: { applicantId },
    });
    if (!existing) {
      throw new BusinessException(
        'Programme selection not found; use POST to create',
        HttpStatus.NOT_FOUND,
        'PROGRAMME_NOT_FOUND',
      );
    }
    await this.persistProgramme(app, applicantId, dto);
    return this.getProgramme(user, applicantId);
  }

  /* ── Addresses ─────────────────────────────────────────────────── */

  async getAddresses(
    user: AuthUser,
    applicantId: string,
  ): Promise<ApplicationAddressResponseDto[]> {
    const app = await this.requireOwnedEditable(user, applicantId, false);
    const rows = await this.addressesRepo.find({
      where: { applicantId, tenantId: app.tenantId },
      order: { addressType: 'ASC' },
    });
    return rows.map((r) => this.toAddress(r));
  }

  async createAddresses(
    user: AuthUser,
    applicantId: string,
    dto: CreateAddressesDto,
  ): Promise<ApplicationAddressResponseDto[]> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertAddressTypesUnique(dto.addresses);

    const existing = await this.addressesRepo.find({
      where: { applicantId, tenantId: app.tenantId },
    });
    const existingTypes = new Set(existing.map((e) => e.addressType));
    for (const address of dto.addresses) {
      if (existingTypes.has(address.addressType)) {
        throw new BusinessException(
          `Address type ${address.addressType} already exists; use PUT to update`,
          HttpStatus.CONFLICT,
          'ADDRESS_TYPE_EXISTS',
        );
      }
    }

    const mergedTypes = [
      ...existing.map((e) => e.addressType),
      ...dto.addresses.map((a) => a.addressType),
    ];
    if (!mergedTypes.includes(ApplicationAddressType.PRIMARY)) {
      throw new BusinessException(
        'PRIMARY address is required',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PRIMARY_ADDRESS_REQUIRED',
      );
    }

    await this.addressesRepo.save(
      dto.addresses.map((a) =>
        this.addressesRepo.create({
          tenantId: app.tenantId,
          applicantId,
          ...this.mapAddressFields(a),
        }),
      ),
    );
    return this.getAddresses(user, applicantId);
  }

  async updateAddresses(
    user: AuthUser,
    applicantId: string,
    dto: UpdateAddressesDto,
  ): Promise<ApplicationAddressResponseDto[]> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertAddressTypesUnique(dto.addresses);
    await this.applyAddressUpdates(app.tenantId, applicantId, dto.addresses);
    return this.getAddresses(user, applicantId);
  }

  /* ── Contacts ──────────────────────────────────────────────────── */

  async getContacts(
    user: AuthUser,
    applicantId: string,
  ): Promise<ApplicationContactResponseDto[]> {
    const app = await this.requireOwnedEditable(user, applicantId, false);
    const rows = await this.contactsRepo.find({
      where: { applicantId, tenantId: app.tenantId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.toContact(r));
  }

  async createContacts(
    user: AuthUser,
    applicantId: string,
    dto: CreateContactsDto,
  ): Promise<ApplicationContactResponseDto[]> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertEmergencyRules(dto.contacts);

    const existing = await this.contactsRepo.find({
      where: { applicantId, tenantId: app.tenantId },
    });
    const merged = [...existing, ...dto.contacts];
    this.assertHasEmergency(merged);

    await this.contactsRepo.save(
      dto.contacts.map((c) =>
        this.contactsRepo.create({
          tenantId: app.tenantId,
          applicantId,
          ...this.mapContactFields(c),
        }),
      ),
    );
    return this.getContacts(user, applicantId);
  }

  async updateContacts(
    user: AuthUser,
    applicantId: string,
    dto: UpdateContactsDto,
  ): Promise<ApplicationContactResponseDto[]> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertEmergencyRules(dto.contacts);
    await this.applyContactUpdates(app.tenantId, applicantId, dto.contacts);
    return this.getContacts(user, applicantId);
  }

  /* ── Profile ───────────────────────────────────────────────────── */

  async getProfile(
    user: AuthUser,
    applicantId: string,
  ): Promise<ProfileStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId, false);
    const [addresses, contacts] = await Promise.all([
      this.getAddresses(user, applicantId),
      this.getContacts(user, applicantId),
    ]);
    return {
      applicantId,
      applicantName: app.applicantName,
      gender: app.gender,
      maritalStatus: app.maritalStatus,
      dateOfBirth: app.dateOfBirth,
      mobileNumber: app.mobileNumber,
      telephone: app.telephone,
      profilePhotograph: app.profilePhotograph,
      primaryNationalityId: app.primaryNationalityId,
      secondaryNationalityId: app.secondaryNationalityId,
      domicileId: app.domicileId,
      disabilityDeclared: app.disabilityDeclared,
      referralSource: app.referralSource,
      addresses,
      contacts,
      profileStepSaved: app.profileStepSaved,
      overallCompletion: app.overallCompletion,
    };
  }

  async createProfile(
    user: AuthUser,
    applicantId: string,
    dto: CreateProfileDto,
  ): Promise<ProfileStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    if (app.profileStepSaved) {
      throw new BusinessException(
        'Profile already created; use PUT to update',
        HttpStatus.CONFLICT,
        'PROFILE_ALREADY_EXISTS',
      );
    }
    this.assertAddressTypesUnique(dto.addresses);
    if (
      !dto.addresses.some((a) => a.addressType === ApplicationAddressType.PRIMARY)
    ) {
      throw new BusinessException(
        'PRIMARY address is required',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PRIMARY_ADDRESS_REQUIRED',
      );
    }
    this.assertEmergencyRules(dto.contacts);
    this.assertHasEmergency(dto.contacts);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ApplicationEntity).update(
        applicantId,
        this.mapProfileFields(dto, app),
      );
      await manager.getRepository(ApplicationAddressEntity).save(
        dto.addresses.map((a) =>
          manager.getRepository(ApplicationAddressEntity).create({
            tenantId: app.tenantId,
            applicantId,
            ...this.mapAddressFields(a),
          }),
        ),
      );
      await manager.getRepository(ApplicationContactEntity).save(
        dto.contacts.map((c) =>
          manager.getRepository(ApplicationContactEntity).create({
            tenantId: app.tenantId,
            applicantId,
            ...this.mapContactFields(c),
          }),
        ),
      );
    });

    return this.getProfile(user, applicantId);
  }

  async updateProfile(
    user: AuthUser,
    applicantId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    if (!app.profileStepSaved) {
      throw new BusinessException(
        'Profile not found; use POST to create',
        HttpStatus.NOT_FOUND,
        'PROFILE_NOT_FOUND',
      );
    }
    this.assertAddressTypesUnique(dto.addresses);
    this.assertEmergencyRules(dto.contacts);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ApplicationEntity).update(
        applicantId,
        this.mapProfileFields(dto, app),
      );
      await this.applyAddressUpdates(
        app.tenantId,
        applicantId,
        dto.addresses,
        manager.getRepository(ApplicationAddressEntity),
      );
      await this.applyContactUpdates(
        app.tenantId,
        applicantId,
        dto.contacts,
        manager.getRepository(ApplicationContactEntity),
      );
    });

    return this.getProfile(user, applicantId);
  }

  /* ── Declaration / Submit ──────────────────────────────────────── */

  async getDeclaration(
    user: AuthUser,
    applicantId: string,
  ): Promise<DeclarationStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId, false);
    const row = await this.declarationsRepo.findOne({
      where: { applicantId, tenantId: app.tenantId },
    });
    return this.toDeclaration(app, row);
  }

  async createDeclaration(
    user: AuthUser,
    applicantId: string,
    dto: CreateDeclarationDto,
  ): Promise<DeclarationStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertPriorStepsComplete(app);
    this.assertDeclarationPayload(dto);

    const existing = await this.declarationsRepo.findOne({
      where: { applicantId },
    });
    if (existing) {
      throw new BusinessException(
        'Declaration already exists; use PUT to update',
        HttpStatus.CONFLICT,
        'DECLARATION_ALREADY_EXISTS',
      );
    }

    await this.persistDeclaration(app, applicantId, dto);
    return this.getDeclaration(user, applicantId);
  }

  async updateDeclaration(
    user: AuthUser,
    applicantId: string,
    dto: UpdateDeclarationDto,
  ): Promise<DeclarationStepResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertPriorStepsComplete(app);
    this.assertDeclarationPayload(dto);

    const existing = await this.declarationsRepo.findOne({
      where: { applicantId },
    });
    if (!existing) {
      throw new BusinessException(
        'Declaration not found; use POST to create',
        HttpStatus.NOT_FOUND,
        'DECLARATION_NOT_FOUND',
      );
    }

    await this.persistDeclaration(app, applicantId, dto, existing);
    return this.getDeclaration(user, applicantId);
  }

  async submit(
    user: AuthUser,
    applicantId: string,
  ): Promise<SubmitApplicationResponseDto> {
    const app = await this.requireOwnedEditable(user, applicantId);
    this.assertPriorStepsComplete(app);

    if (!app.declarationStepSaved) {
      throw new BusinessException(
        'Declaration step must be saved before submission',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DECLARATION_STEP_INCOMPLETE',
      );
    }

    const declaration = await this.declarationsRepo.findOne({
      where: { applicantId, tenantId: app.tenantId },
    });
    if (!declaration) {
      throw new BusinessException(
        'Declaration record is required',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DECLARATION_REQUIRED',
      );
    }
    if (!declaration.declarationAccepted) {
      throw new BusinessException(
        'Declaration must be accepted before submission',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DECLARATION_NOT_ACCEPTED',
      );
    }
    if (
      declaration.disciplinaryIssueDeclared &&
      !declaration.disciplinaryIssueDetails?.trim()
    ) {
      throw new BusinessException(
        'Disciplinary issue details are required',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DISCIPLINARY_DETAILS_REQUIRED',
      );
    }
    if (!declaration.selectedTestCentreId?.trim()) {
      throw new BusinessException(
        'Test centre selection is required',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'TEST_CENTRE_REQUIRED',
      );
    }

    if (
      app.applicationStatus === ApplicationStatus.COMPLETE ||
      app.applicationStatus === ApplicationStatus.SUBMITTED
    ) {
      return {
        applicantId,
        applicationStatus: app.applicationStatus,
        overallCompletion: app.overallCompletion,
        submissionDate: app.submissionDate ?? declaration.submissionDate!,
      };
    }

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(ApplicationEntity).update(applicantId, {
        applicationStatus: ApplicationStatus.COMPLETE,
        overallCompletion: 100,
        submissionDate: now,
        appliedDate: app.appliedDate ?? now,
      });
      await manager.getRepository(ApplicationDeclarationEntity).update(
        { applicantId },
        { submissionDate: now },
      );
    });

    return {
      applicantId,
      applicationStatus: ApplicationStatus.COMPLETE,
      overallCompletion: 100,
      submissionDate: now,
    };
  }

  /* ── Helpers ───────────────────────────────────────────────────── */

  private async persistProgramme(
    app: ApplicationEntity,
    applicantId: string,
    dto: CreateProgrammeDto,
  ): Promise<void> {
    this.assertProgrammeOptions(dto);

    const offeringIds = dto.options.map((o) => o.programmeOfferingId);
    const offerings = await this.offeringsRepo.find({
      where: {
        id: In(offeringIds),
        tenantId: app.tenantId,
        intakeId: app.intakeId,
      },
    });
    if (offerings.length !== offeringIds.length) {
      throw new BusinessException(
        'One or more programme offerings are invalid for this intake',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'INVALID_PROGRAMME_OFFERING',
      );
    }
    for (const offering of offerings) {
      if (offering.offeringStatus !== OfferingStatus.PUBLISHED) {
        throw new BusinessException(
          'Programme offering must be published',
          HttpStatus.UNPROCESSABLE_ENTITY,
          'UNPUBLISHED_PROGRAMME',
        );
      }
    }

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      const selectionRepo = manager.getRepository(
        ApplicationProgrammeSelectionEntity,
      );
      const optionsRepo = manager.getRepository(
        ApplicationProgrammeOptionEntity,
      );
      const appsRepo = manager.getRepository(ApplicationEntity);

      let selection = await selectionRepo.findOne({ where: { applicantId } });
      if (!selection) {
        selection = selectionRepo.create({
          applicantId,
          tenantId: app.tenantId,
          intakeSessionId: app.intakeId,
          qualificationLevel: dto.qualificationLevel,
          appliedDate: now,
          stepSaved: true,
          savedAt: now,
        });
      } else {
        selection.qualificationLevel = dto.qualificationLevel;
        selection.intakeSessionId = app.intakeId;
        selection.stepSaved = true;
        selection.savedAt = now;
      }
      await selectionRepo.save(selection);

      await optionsRepo.delete({ applicantId });
      await optionsRepo.save(
        dto.options.map((opt) =>
          optionsRepo.create({
            tenantId: app.tenantId,
            applicantId,
            programmeOfferingId: opt.programmeOfferingId,
            preferenceOrder: opt.preferenceOrder,
          }),
        ),
      );

      await appsRepo.update(applicantId, {
        programmeStepSaved: true,
        appliedDate: now,
        applicationStatus: this.inProgressStatus(app),
        overallCompletion: this.completionPercent({
          ...app,
          programmeStepSaved: true,
        }),
      });
    });
  }

  private async persistDeclaration(
    app: ApplicationEntity,
    applicantId: string,
    dto: CreateDeclarationDto,
    existing?: ApplicationDeclarationEntity,
  ): Promise<void> {
    const now = new Date();
    const row =
      existing ??
      this.declarationsRepo.create({
        applicantId,
        tenantId: app.tenantId,
      });
    row.declarationAccepted = dto.declarationAccepted;
    row.declarationAcceptanceDate = dto.declarationAccepted ? now : null;
    row.declarationVersion = dto.declarationVersion ?? null;
    row.disciplinaryIssueDeclared = dto.disciplinaryIssueDeclared;
    row.disciplinaryIssueDetails = dto.disciplinaryIssueDeclared
      ? (dto.disciplinaryIssueDetails ?? null)
      : null;
    row.selectedTestCentreId = dto.selectedTestCentreId;
    await this.declarationsRepo.save(row);

    await this.applicationsRepo.update(applicantId, {
      declarationStepSaved: true,
      applicationStatus: this.inProgressStatus(app),
      overallCompletion: this.completionPercent({
        ...app,
        declarationStepSaved: true,
      }),
    });
  }

  private async requireOwnedEditable(
    user: AuthUser,
    applicantId: string,
    requireEditable = true,
  ): Promise<ApplicationEntity> {
    const app = await this.applicationsRepo.findOne({
      where: { id: applicantId, tenantId: user.tenantId },
    });
    if (!app) {
      throw new NotFoundException('Application not found');
    }
    if (!app.iamUserId || app.iamUserId !== user.userId) {
      throw new ForbiddenException('You do not own this application');
    }
    if (
      requireEditable &&
      (app.applicationStatus === ApplicationStatus.COMPLETE ||
        app.applicationStatus === ApplicationStatus.SUBMITTED)
    ) {
      throw new BusinessException(
        'Submitted applications are read-only',
        HttpStatus.CONFLICT,
        'APPLICATION_READ_ONLY',
      );
    }
    return app;
  }

  private inProgressStatus(app: ApplicationEntity): ApplicationStatus {
    if (
      app.applicationStatus === ApplicationStatus.REGISTERED ||
      app.applicationStatus === ApplicationStatus.IN_PROGRESS
    ) {
      return ApplicationStatus.IN_PROGRESS;
    }
    return app.applicationStatus as ApplicationStatus;
  }

  private completionPercent(
    app: Pick<
      ApplicationEntity,
      | 'academicStepSaved'
      | 'programmeStepSaved'
      | 'profileStepSaved'
      | 'declarationStepSaved'
    >,
  ): number {
    let steps = 0;
    if (app.academicStepSaved) steps += 1;
    if (app.programmeStepSaved) steps += 1;
    if (app.profileStepSaved) steps += 1;
    if (app.declarationStepSaved) steps += 1;
    return steps * 25;
  }

  private assertPriorStepsComplete(app: ApplicationEntity): void {
    if (!app.academicStepSaved) {
      throw new BusinessException(
        'Academic step must be completed first',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'ACADEMIC_STEP_INCOMPLETE',
      );
    }
    if (!app.programmeStepSaved) {
      throw new BusinessException(
        'Programme step must be completed first',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PROGRAMME_STEP_INCOMPLETE',
      );
    }
    if (!app.profileStepSaved) {
      throw new BusinessException(
        'Profile step must be completed first',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'PROFILE_STEP_INCOMPLETE',
      );
    }
  }

  private assertProgrammeOptions(dto: CreateProgrammeDto): void {
    const orders = dto.options.map((o) => o.preferenceOrder);
    if (!orders.includes(1)) {
      throw new BusinessException(
        'Preference order 1 is mandatory',
        HttpStatus.BAD_REQUEST,
        'PREFERENCE_1_REQUIRED',
      );
    }
    if (new Set(orders).size !== orders.length) {
      throw new BusinessException(
        'Duplicate preference orders are not allowed',
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_PREFERENCE',
      );
    }
    const offeringIds = dto.options.map((o) => o.programmeOfferingId);
    if (new Set(offeringIds).size !== offeringIds.length) {
      throw new BusinessException(
        'Duplicate programme offerings are not allowed',
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_OFFERING',
      );
    }
  }

  private assertAddressTypesUnique(
    addresses: Array<{ addressType: ApplicationAddressType }>,
  ): void {
    const types = addresses.map((a) => a.addressType);
    if (new Set(types).size !== types.length) {
      throw new BusinessException(
        'At most one address per address type is allowed',
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_ADDRESS_TYPE',
      );
    }
  }

  private assertHasEmergency(
    contacts: Array<{ contactType: ApplicationContactType }>,
  ): void {
    if (
      !contacts.some((c) => c.contactType === ApplicationContactType.EMERGENCY)
    ) {
      throw new BusinessException(
        'EMERGENCY contact is required',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'EMERGENCY_CONTACT_REQUIRED',
      );
    }
  }

  private assertEmergencyRules(
    contacts: Array<{
      contactType: ApplicationContactType;
      relationship: string;
    }>,
  ): void {
    for (const contact of contacts) {
      if (contact.contactType !== ApplicationContactType.EMERGENCY) continue;
      const relation = contact.relationship.trim().toUpperCase();
      if (BLOCKED_EMERGENCY_RELATIONS.has(relation)) {
        throw new BusinessException(
          'Emergency contact must not be father or guardian',
          HttpStatus.UNPROCESSABLE_ENTITY,
          'INVALID_EMERGENCY_RELATIONSHIP',
        );
      }
      if (!BLOOD_RELATIONS.has(relation)) {
        throw new BusinessException(
          'Emergency contact must be a blood relation',
          HttpStatus.UNPROCESSABLE_ENTITY,
          'INVALID_EMERGENCY_RELATIONSHIP',
        );
      }
    }
  }

  private assertDeclarationPayload(dto: CreateDeclarationDto): void {
    if (!dto.declarationAccepted) {
      throw new BusinessException(
        'Declaration must be accepted',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DECLARATION_NOT_ACCEPTED',
      );
    }
    if (
      dto.disciplinaryIssueDeclared &&
      !dto.disciplinaryIssueDetails?.trim()
    ) {
      throw new BusinessException(
        'Disciplinary issue details are required when declared',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DISCIPLINARY_DETAILS_REQUIRED',
      );
    }
  }

  private mapProfileFields(dto: ProfileFieldsDto, app: ApplicationEntity) {
    return {
      applicantName: dto.applicantName,
      gender: dto.gender,
      maritalStatus: dto.maritalStatus,
      dateOfBirth: dto.dateOfBirth,
      mobileNumber: dto.mobileNumber,
      telephone: dto.telephone ?? null,
      profilePhotograph: dto.profilePhotograph ?? null,
      primaryNationalityId: dto.primaryNationalityId,
      secondaryNationalityId: dto.secondaryNationalityId ?? null,
      domicileId: dto.domicileId ?? null,
      disabilityDeclared: dto.disabilityDeclared,
      referralSource: dto.referralSource ?? null,
      profileStepSaved: true,
      applicationStatus: this.inProgressStatus(app),
      overallCompletion: this.completionPercent({
        ...app,
        profileStepSaved: true,
      }),
    };
  }

  private mapAddressFields(a: AddressFieldsDto) {
    return {
      addressType: a.addressType,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? null,
      countryId: a.countryId,
      provinceId: a.provinceId,
      cityId: a.cityId,
      postalCode: a.postalCode ?? null,
      isSameAsPrimary: a.isSameAsPrimary ?? false,
    };
  }

  private mapContactFields(c: ContactFieldsDto) {
    return {
      contactType: c.contactType,
      name: c.name,
      identityDocumentNumber: c.identityDocumentNumber ?? null,
      relationship: c.relationship,
      occupation: c.occupation ?? null,
      mobileNumber: c.mobileNumber,
      telephone: c.telephone ?? null,
      email: c.email ?? null,
      addressLine: c.addressLine ?? null,
    };
  }

  private async applyAddressUpdates(
    tenantId: string,
    applicantId: string,
    addresses: UpdateAddressDto[],
    repo: Repository<ApplicationAddressEntity> = this.addressesRepo,
  ): Promise<void> {
    const ids = addresses.map((a) => a.id);
    if (new Set(ids).size !== ids.length) {
      throw new BusinessException(
        'Duplicate address ids in request',
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_ADDRESS_ID',
      );
    }
    const existing = await repo.find({
      where: { id: In(ids), applicantId, tenantId },
    });
    if (existing.length !== ids.length) {
      throw new BusinessException(
        'One or more addresses were not found',
        HttpStatus.NOT_FOUND,
        'ADDRESS_NOT_FOUND',
      );
    }
    const byId = new Map(existing.map((e) => [e.id, e]));
    for (const address of addresses) {
      const row = byId.get(address.id)!;
      Object.assign(row, this.mapAddressFields(address));
      await repo.save(row);
    }
  }

  private async applyContactUpdates(
    tenantId: string,
    applicantId: string,
    contacts: UpdateContactDto[],
    repo: Repository<ApplicationContactEntity> = this.contactsRepo,
  ): Promise<void> {
    const ids = contacts.map((c) => c.id);
    if (new Set(ids).size !== ids.length) {
      throw new BusinessException(
        'Duplicate contact ids in request',
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_CONTACT_ID',
      );
    }
    const existing = await repo.find({
      where: { id: In(ids), applicantId, tenantId },
    });
    if (existing.length !== ids.length) {
      throw new BusinessException(
        'One or more contacts were not found',
        HttpStatus.NOT_FOUND,
        'CONTACT_NOT_FOUND',
      );
    }
    const byId = new Map(existing.map((e) => [e.id, e]));
    for (const contact of contacts) {
      const row = byId.get(contact.id)!;
      Object.assign(row, this.mapContactFields(contact));
      await repo.save(row);
    }
  }

  private mapAcademicFields(record: {
    degreeType: string;
    qualificationName: string;
    boardOrInstitution: string;
    passingYear: string;
    division: string;
    grade: string;
    marksOrGpaObtained: string;
    marksOrGpaTotal: string;
    percentage: number;
  }) {
    return {
      degreeType: record.degreeType,
      qualificationName: record.qualificationName,
      boardOrInstitution: record.boardOrInstitution,
      passingYear: record.passingYear,
      division: record.division,
      grade: record.grade,
      marksOrGpaObtained: record.marksOrGpaObtained,
      marksOrGpaTotal: record.marksOrGpaTotal,
      percentage: record.percentage.toFixed(2),
    };
  }

  private toAcademicRecord(
    row: ApplicationAcademicInformationEntity,
  ): AcademicRecordResponseDto {
    return {
      id: row.id,
      degreeType: row.degreeType,
      qualificationName: row.qualificationName,
      boardOrInstitution: row.boardOrInstitution,
      passingYear: row.passingYear,
      division: row.division,
      grade: row.grade,
      marksOrGpaObtained: row.marksOrGpaObtained,
      marksOrGpaTotal: row.marksOrGpaTotal,
      percentage: Number(row.percentage),
      documents: (row.documents ?? []).map((d) => this.toAcademicDocument(d)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toAcademicDocument(
    row: ApplicationAcademicDocumentEntity,
  ): AcademicDocumentResponseDto {
    return {
      id: row.id,
      academicInformationId: row.academicInformationId,
      documentType: row.documentType,
      fileReference: row.fileReference,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      uploadedAt: row.uploadedAt,
      verificationStatus: row.verificationStatus,
    };
  }

  private toAddress(
    row: ApplicationAddressEntity,
  ): ApplicationAddressResponseDto {
    return {
      id: row.id,
      addressType: row.addressType,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      countryId: row.countryId,
      provinceId: row.provinceId,
      cityId: row.cityId,
      postalCode: row.postalCode,
      isSameAsPrimary: row.isSameAsPrimary,
    };
  }

  private toContact(
    row: ApplicationContactEntity,
  ): ApplicationContactResponseDto {
    return {
      id: row.id,
      contactType: row.contactType,
      name: row.name,
      identityDocumentNumber: row.identityDocumentNumber,
      relationship: row.relationship,
      occupation: row.occupation,
      mobileNumber: row.mobileNumber,
      telephone: row.telephone,
      email: row.email,
      addressLine: row.addressLine,
    };
  }

  private toDeclaration(
    app: ApplicationEntity,
    row: ApplicationDeclarationEntity | null,
  ): DeclarationStepResponseDto {
    return {
      applicantId: app.id,
      declarationAccepted: row?.declarationAccepted ?? false,
      declarationAcceptanceDate: row?.declarationAcceptanceDate ?? null,
      declarationVersion: row?.declarationVersion ?? null,
      disciplinaryIssueDeclared: row?.disciplinaryIssueDeclared ?? false,
      disciplinaryIssueDetails: row?.disciplinaryIssueDetails ?? null,
      selectedTestCentreId: row?.selectedTestCentreId ?? null,
      submissionDate: row?.submissionDate ?? app.submissionDate,
      declarationStepSaved: app.declarationStepSaved,
      overallCompletion: app.overallCompletion,
      applicationStatus: app.applicationStatus,
    };
  }
}
