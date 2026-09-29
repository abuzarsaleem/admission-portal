import { ConflictException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';
import { DataSource, In, Repository } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { AdmissionDocumentSource, AdmissionDocumentStatus } from '../../common/enums/admission-document.enum.js';
import { EDITABLE_OFFERING_STATUSES } from '../../common/enums/offering-status.enum.js';
import type { RequestContext } from '../../common/decorators/request-context.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { ApplicantDocumentEntity, ApplicationAcademicDocumentEntity, ApplicationEntity, ApplicationProgrammeOptionEntity, DocumentTypeEntity, DocumentVerificationAuditEntity, OfferingRequiredDocumentEntity, ProgrammeOfferingEntity } from '../../database/entities/index.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../../integrations/storage/object-storage.interface.js';
import { Inject } from '@nestjs/common';
import type { CreateDocumentTypeDto, CreateOfferingRequirementsDto, LinkAcademicDocumentDto, RequestResubmissionDto, UpdateOfferingRequirementDto } from './dto/admission-document.dto.js';
import { ProgrammeOfferingsService } from '../programme-offerings/programme-offerings.service.js';

export interface AdmissionUpload { buffer: Buffer; originalname: string; mimetype: string; size: number; }
const MIME_EXT: Record<string, string[]> = { 'image/jpeg': ['.jpg','.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'], 'image/bmp': ['.bmp'], 'application/pdf': ['.pdf'] };
const STAFF_ROLES = new Set(['ADMISSION_MANAGER','ADMISSIONS_MANAGER','ADMISSIONS_ADMIN','ADMISSIONS_OFFICER','ADMIN','SUPER_ADMIN']);

@Injectable()
export class AdmissionDocumentsService {
  constructor(
    @InjectRepository(DocumentTypeEntity) private readonly types: Repository<DocumentTypeEntity>,
    @InjectRepository(OfferingRequiredDocumentEntity) private readonly requirements: Repository<OfferingRequiredDocumentEntity>,
    @InjectRepository(ApplicantDocumentEntity) private readonly documents: Repository<ApplicantDocumentEntity>,
    @InjectRepository(DocumentVerificationAuditEntity) private readonly audits: Repository<DocumentVerificationAuditEntity>,
    @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationProgrammeOptionEntity) private readonly options: Repository<ApplicationProgrammeOptionEntity>,
    @InjectRepository(ProgrammeOfferingEntity) private readonly offerings: Repository<ProgrammeOfferingEntity>,
    @InjectRepository(ApplicationAcademicDocumentEntity) private readonly academicDocs: Repository<ApplicationAcademicDocumentEntity>,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly dataSource: DataSource,
    private readonly programmeOfferingsService: ProgrammeOfferingsService,
  ) {}

  async listTypes(user: RequestContext) { this.assertStaff(user); return this.types.find({ order: { category: 'ASC', name: 'ASC' } }); }
  async createType(user: RequestContext, dto: CreateDocumentTypeDto) {
    this.assertStaff(user); const code = dto.code.trim().toUpperCase();
    if (await this.types.findOne({ where: { code } })) throw new ConflictException('Document type code already exists');
    return this.types.save(this.types.create({ ...dto, code, name: dto.name.trim(), category: dto.category.trim().toUpperCase(), active: dto.active ?? true }));
  }
  async updateType(user: RequestContext, id: string, dto: Partial<CreateDocumentTypeDto>) {
    this.assertStaff(user); const row = await this.types.findOneBy({ id }); if (!row) throw new NotFoundException('Document type not found');
    if (dto.code) row.code = dto.code.trim().toUpperCase(); if (dto.name) row.name = dto.name.trim(); if (dto.category) row.category = dto.category.trim().toUpperCase();
    if (dto.description !== undefined) row.description = dto.description ?? null; if (dto.active !== undefined) row.active = dto.active;
    return this.types.save(row);
  }
  async listRequirements(user: RequestContext, offeringId: string) {
    this.assertStaff(user); await this.requireOffering(user.tenantId, offeringId);
    const rules = await this.requirements.find({ where: { tenantId: user.tenantId, programmeOfferingId: offeringId }, order: { sortOrder: 'ASC' } });
    const map = new Map((await this.types.findBy({ id: In(rules.map(x => x.documentTypeId)) })).map(x => [x.id,x]));
    return rules.map(r => ({ ...r, documentType: map.get(r.documentTypeId) ?? null }));
  }
  async createRequirementsForOfferings(user: RequestContext, dto: CreateOfferingRequirementsDto) {
    this.assertStaff(user);
    for (const offeringId of dto.offeringIds) await this.programmeOfferingsService.ensureEditableOffering(user.tenantId, offeringId);
    const types = await this.types.findBy({ id: In(dto.requirements.map(r => r.documentTypeId)), active: true });
    const typeMap = new Map(types.map(t => [t.id, t]));
    if (typeMap.size !== new Set(dto.requirements.map(r => r.documentTypeId)).size) throw new NotFoundException('One or more active document types were not found');
    const generated = new Set<string>();
    for (const offeringId of dto.offeringIds) for (const item of dto.requirements) {
      const key = `${offeringId}:${item.documentTypeId}`;
      if (generated.has(key) || await this.requirements.findOne({ where: { tenantId: user.tenantId, programmeOfferingId: offeringId, documentTypeId: item.documentTypeId } })) throw new ConflictException(`Document type ${typeMap.get(item.documentTypeId)!.code} is already configured for offering ${offeringId}`);
      generated.add(key);
    }
    const items: Array<Record<string, unknown>> = [];
    await this.dataSource.transaction(async manager => {
      for (const offeringId of dto.offeringIds) for (const item of dto.requirements) {
        const saved = await manager.getRepository(OfferingRequiredDocumentEntity).save(manager.getRepository(OfferingRequiredDocumentEntity).create({ tenantId: user.tenantId, programmeOfferingId: offeringId, documentTypeId: item.documentTypeId, mandatory: item.mandatory ?? true, conditionCode: item.conditionCode?.trim().toUpperCase() ?? null, sortOrder: item.sortOrder ?? 0, active: item.active ?? true, createdBy: user.userId, updatedBy: user.userId }));
        items.push({ ...saved, documentType: typeMap.get(item.documentTypeId)! });
      }
    });
    for (const offeringId of dto.offeringIds) await this.programmeOfferingsService.markConfiguredForSetup(user.tenantId, offeringId, user.userId);
    return { items };
  }
  async updateRequirement(user: RequestContext, id: string, dto: UpdateOfferingRequirementDto) {
    this.assertStaff(user); const row = await this.requirements.findOneBy({ id, tenantId: user.tenantId }); if (!row) throw new NotFoundException('Offering document requirement not found');
    this.assertOfferingEditable(await this.requireOffering(user.tenantId, row.programmeOfferingId));
    if (dto.mandatory !== undefined) row.mandatory = dto.mandatory; if (dto.conditionCode !== undefined) row.conditionCode = dto.conditionCode?.trim().toUpperCase() ?? null;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder; if (dto.active !== undefined) row.active = dto.active; row.updatedBy = user.userId;
    return this.requirements.save(row);
  }
  async deleteRequirement(user: RequestContext, id: string) {
    this.assertStaff(user); const row = await this.requirements.findOneBy({ id, tenantId: user.tenantId }); if (!row) throw new NotFoundException('Offering document requirement not found');
    this.assertOfferingEditable(await this.requireOffering(user.tenantId, row.programmeOfferingId));
    const used = await this.documents.exists({ where: { tenantId: user.tenantId, offeringRequiredDocumentId: id } }); if (used) throw new ConflictException('Requirement has applicant document records; deactivate it instead');
    await this.requirements.remove(row); return { deleted: true, id };
  }

  async applicantRequirements(user: AuthUser, applicantId: string) {
    const app = await this.requireOwned(user, applicantId); const selected = await this.selectedOfferingIds(user.tenantId, applicantId);
    const rules = selected.length ? await this.requirements.find({ where: { tenantId: user.tenantId, programmeOfferingId: In(selected), active: true }, order: { sortOrder: 'ASC' } }) : [];
    const types = await this.types.findBy({ id: In(rules.map(r => r.documentTypeId)) }); const typeMap = new Map(types.map(t => [t.id,t]));
    const docs = await this.documents.find({ where: { tenantId: user.tenantId, applicantId } }); const docMap = new Map(docs.map(d => [d.offeringRequiredDocumentId,d]));
    return rules.map(r => ({ applicantId: app.id, programmeOfferingId: r.programmeOfferingId, offeringRequiredDocumentId: r.id, documentTypeId: r.documentTypeId, documentTypeCode: typeMap.get(r.documentTypeId)?.code, documentTypeName: typeMap.get(r.documentTypeId)?.name, mandatory: r.mandatory, conditionCode: r.conditionCode, status: docMap.get(r.id)?.status ?? AdmissionDocumentStatus.NOT_SUBMITTED, document: docMap.get(r.id) ? this.toDto(docMap.get(r.id)!, typeMap.get(r.documentTypeId)!) : null }));
  }
  async listApplicantDocuments(user: AuthUser, applicantId: string) { await this.requireOwned(user, applicantId); const rows = await this.documents.find({ where: { tenantId: user.tenantId, applicantId }, order: { createdAt: 'ASC' } }); return Promise.all(rows.map(r => this.getDocumentDto(r))); }
  async getApplicantDocument(user: AuthUser, applicantId: string, id: string) { await this.requireOwned(user, applicantId); const row = await this.requireDocument(user.tenantId, applicantId, id); return this.getDocumentDto(row); }
  async upload(user: AuthUser, applicantId: string, requirementId: string, file?: AdmissionUpload) {
    const app = await this.requireOwned(user, applicantId); this.assertSubmitted(app); this.validateFile(file);
    const { rule, type } = await this.requireSelectedRule(user.tenantId, applicantId, requirementId);
    const old = await this.documents.findOne({ where: { tenantId: user.tenantId, applicantId, offeringRequiredDocumentId: requirementId } });
    if (old && old.status === AdmissionDocumentStatus.VERIFIED) throw new ConflictException('A verified document cannot be replaced');
    if (old && old.status !== AdmissionDocumentStatus.RESUBMISSION_REQUIRED) throw new ConflictException('Document already submitted; use replace after it is returned for resubmission');
    return this.storeUpload(user, app, rule, type, file!, old, 'REPLACED');
  }
  async replace(user: AuthUser, applicantId: string, id: string, file?: AdmissionUpload) {
    const app = await this.requireOwned(user, applicantId); this.assertSubmitted(app); this.validateFile(file);
    const row = await this.requireDocument(user.tenantId, applicantId, id); if (row.status === AdmissionDocumentStatus.VERIFIED) throw new ConflictException('A verified document cannot be replaced');
    if (![AdmissionDocumentStatus.SUBMITTED, AdmissionDocumentStatus.RESUBMISSION_REQUIRED].includes(row.status as AdmissionDocumentStatus)) throw new ConflictException('Only submitted or returned documents can be replaced');
    const rule = await this.requirements.findOneBy({ id: row.offeringRequiredDocumentId, tenantId: user.tenantId }); const type = await this.types.findOneBy({ id: row.documentTypeId });
    if (!rule || !type) throw new NotFoundException('Document requirement not found'); return this.storeUpload(user, app, rule, type, file!, row, 'REPLACED');
  }
  async linkAcademic(user: AuthUser, applicantId: string, dto: LinkAcademicDocumentDto) {
    const app = await this.requireOwned(user, applicantId); this.assertSubmitted(app);
    const { rule, type } = await this.requireSelectedRule(user.tenantId, applicantId, dto.offeringRequiredDocumentId);
    if (type.category !== 'ACADEMIC') throw new BusinessException('F002 academic documents can satisfy academic requirements only', HttpStatus.UNPROCESSABLE_ENTITY, 'DOCUMENT_CATEGORY_MISMATCH');
    const source = await this.academicDocs.findOne({ where: { id: dto.academicDocumentId, tenantId: user.tenantId, applicantId } }); if (!source) throw new NotFoundException('F002 academic document not found for this applicant');
    const codeMatches = source.documentType === 'TRANSCRIPT' ? type.code === 'TRANSCRIPT' : source.documentType === 'CERTIFICATE' ? type.code.endsWith('_CERTIFICATE') || type.code === 'EQUIVALENCE_CERTIFICATE' : type.code.endsWith('_MARKSHEET');
    if (!codeMatches) throw new BusinessException('The F002 document type does not match the configured offering requirement', HttpStatus.UNPROCESSABLE_ENTITY, 'DOCUMENT_TYPE_MISMATCH');
    const existing = await this.documents.findOne({ where: { tenantId: user.tenantId, applicantId, offeringRequiredDocumentId: rule.id } });
    if (existing?.status === AdmissionDocumentStatus.VERIFIED) throw new ConflictException('Document requirement is already verified');
    const row = existing ?? this.documents.create({ tenantId: user.tenantId, applicantId, applicationId: String(app.applicationId), programmeOfferingId: rule.programmeOfferingId, offeringRequiredDocumentId: rule.id, documentTypeId: type.id });
    const from = row.status || null; Object.assign(row, { sourceModule: AdmissionDocumentSource.F002, sourceDocumentId: source.id, fileReference: null, fileName: source.originalFileName, mimeType: source.mimeType, fileSizeBytes: source.fileSize == null ? null : String(source.fileSize), status: AdmissionDocumentStatus.SUBMITTED, submittedBy: user.userId, submittedAt: new Date(), resubmissionReason: null, resubmissionRequestedAt: null, verifiedBy: null, verifiedAt: null });
    const saved = await this.saveWithAudit(user, row, existing ? 'REPLACED' : 'UPLOADED', from, AdmissionDocumentStatus.SUBMITTED, null); return this.getDocumentDto(saved);
  }
  async completeness(user: AuthUser, applicantId: string) {
    const requirements = await this.applicantRequirements(user, applicantId); const blocking = requirements.filter((r: any) => r.mandatory || r.conditionCode);
    const verifiedCount = blocking.filter((r: any) => r.status === AdmissionDocumentStatus.VERIFIED).length;
    return { applicantId, complete: blocking.length === verifiedCount, requiredCount: blocking.length, verifiedCount, requirements };
  }

  async reviewCompleteness(tenantId: string, applicantId: string) {
    const selected = await this.selectedOfferingIds(tenantId, applicantId);
    const rules = selected.length ? await this.requirements.find({ where: { tenantId, programmeOfferingId: In(selected), active: true } }) : [];
    const blocking = rules.filter(r => r.mandatory || Boolean(r.conditionCode));
    const docs = blocking.length ? await this.documents.find({ where: { tenantId, applicantId, offeringRequiredDocumentId: In(blocking.map(r => r.id)) } }) : [];
    const byRequirement = new Map(docs.map(d => [d.offeringRequiredDocumentId, d]));
    const outstanding = blocking.filter(r => byRequirement.get(r.id)?.status !== AdmissionDocumentStatus.VERIFIED);
    return { complete: outstanding.length === 0, requiredCount: blocking.length, verifiedCount: blocking.length - outstanding.length, outstandingRequirementIds: outstanding.map(r => r.id) };
  }

  async staffApplicationDocuments(user: RequestContext, applicantId: string) { this.assertStaff(user); const app = await this.applications.findOneBy({ id: applicantId, tenantId: user.tenantId }); if (!app) throw new NotFoundException('Application not found'); return this.listByApplicant(user.tenantId, applicantId); }
  async pending(user: RequestContext) { this.assertStaff(user); const rows = await this.documents.find({ where: { tenantId: user.tenantId, status: AdmissionDocumentStatus.SUBMITTED }, order: { submittedAt: 'ASC' } }); return Promise.all(rows.map(r => this.getDocumentDto(r))); }
  async exceptions(user: RequestContext) { this.assertStaff(user); const rows = await this.documents.find({ where: { tenantId: user.tenantId, status: In([AdmissionDocumentStatus.SUBMITTED, AdmissionDocumentStatus.RESUBMISSION_REQUIRED]) }, order: { updatedAt: 'ASC' } }); return Promise.all(rows.map(r => this.getDocumentDto(r))); }
  async verify(user: RequestContext, id: string) { this.assertStaff(user); const row = await this.requireDocument(user.tenantId, undefined, id); if (row.status !== AdmissionDocumentStatus.SUBMITTED) throw new ConflictException('Only submitted documents can be verified'); const from = row.status; row.status = AdmissionDocumentStatus.VERIFIED; row.verifiedBy = user.userId; row.verifiedAt = new Date(); row.resubmissionReason = null; const saved = await this.saveWithAudit(user, row, 'VERIFIED', from, row.status, null); return this.getDocumentDto(saved); }
  async requestResubmission(user: RequestContext, id: string, dto: RequestResubmissionDto) { this.assertStaff(user); const reason = dto.reason.trim(); if (!reason) throw new BusinessException('A resubmission reason is required', HttpStatus.UNPROCESSABLE_ENTITY, 'RESUBMISSION_REASON_REQUIRED'); const row = await this.requireDocument(user.tenantId, undefined, id); if (row.status !== AdmissionDocumentStatus.SUBMITTED) throw new ConflictException('Only submitted documents can be returned'); const from = row.status; row.status = AdmissionDocumentStatus.RESUBMISSION_REQUIRED; row.resubmissionReason = reason; row.resubmissionRequestedAt = new Date(); row.verifiedAt = null; row.verifiedBy = null; const saved = await this.saveWithAudit(user, row, 'RESUBMISSION_REQUESTED', from, row.status, reason); return this.getDocumentDto(saved); }
  async auditHistory(user: RequestContext, id: string) { this.assertStaff(user); await this.requireDocument(user.tenantId, undefined, id); return this.audits.find({ where: { tenantId: user.tenantId, applicantDocumentId: id }, order: { actedAt: 'ASC' } }); }

  private async storeUpload(user: AuthUser, app: ApplicationEntity, rule: OfferingRequiredDocumentEntity, type: DocumentTypeEntity, file: AdmissionUpload, existing: ApplicantDocumentEntity | null, action: string) {
    const stored = await this.storage.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: `admissions/documents/${app.id}/${rule.programmeOfferingId}`, fileName: file.originalname });
    try {
      const oldRef = existing?.fileReference;
      const row = existing ?? this.documents.create({ tenantId: user.tenantId, applicantId: app.id, applicationId: String(app.applicationId), programmeOfferingId: rule.programmeOfferingId, offeringRequiredDocumentId: rule.id, documentTypeId: type.id });
      const from = existing?.status ?? null;
      Object.assign(row, { sourceModule: AdmissionDocumentSource.F004, sourceDocumentId: null, fileReference: stored.publicUrl, fileName: file.originalname, mimeType: file.mimetype, fileSizeBytes: String(file.size), checksumSha256: createHash('sha256').update(file.buffer).digest('hex'), status: AdmissionDocumentStatus.SUBMITTED, submittedBy: user.userId, submittedAt: new Date(), resubmissionReason: null, resubmissionRequestedAt: null, verifiedBy: null, verifiedAt: null });
      const saved = await this.saveWithAudit(user, row, existing ? action : 'UPLOADED', from, AdmissionDocumentStatus.SUBMITTED, null);
      if (oldRef && oldRef !== stored.publicUrl) { try { await this.storage.delete(oldRef); } catch { /* best-effort cleanup */ } }
      return { ...(await this.toDto(saved, type)), downloadUrl: stored.downloadUrl };
    } catch (e) { try { await this.storage.delete(stored.storageKey); } catch { /* best-effort cleanup */ } throw e; }
  }
  private validateFile(file?: AdmissionUpload): asserts file is AdmissionUpload {
    if (!file) throw new BusinessException('Document file is required', HttpStatus.BAD_REQUEST, 'FILE_REQUIRED');
    const allowed = MIME_EXT[file.mimetype]; if (!allowed || !allowed.includes(extname(file.originalname).toLowerCase()) || !this.matchesSignature(file.buffer, file.mimetype)) throw new BusinessException('Only matching JPG, JPEG, PNG, GIF, BMP, and PDF files are allowed', HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'INVALID_DOCUMENT_FORMAT');
    const max = Number(process.env.ADMISSION_DOCUMENT_MAX_BYTES || 10 * 1024 * 1024); if (file.size > max) throw new BusinessException('Document exceeds the configured maximum file size', HttpStatus.PAYLOAD_TOO_LARGE, 'FILE_TOO_LARGE');
  }
  private async requireSelectedRule(tenantId: string, applicantId: string, ruleId: string) {
    const rule = await this.requirements.findOneBy({ id: ruleId, tenantId, active: true }); if (!rule) throw new BusinessException('Active document requirement not found', HttpStatus.UNPROCESSABLE_ENTITY, 'INVALID_DOCUMENT_REQUIREMENT');
    const selected = await this.selectedOfferingIds(tenantId, applicantId); if (!selected.includes(rule.programmeOfferingId)) throw new BusinessException('Document requirement is not for an offering selected by this applicant', HttpStatus.UNPROCESSABLE_ENTITY, 'DOCUMENT_REQUIREMENT_NOT_SELECTED');
    const type = await this.types.findOneBy({ id: rule.documentTypeId, active: true }); if (!type) throw new NotFoundException('Active document type not found'); return { rule, type };
  }
  private async selectedOfferingIds(tenantId: string, applicantId: string) { const rows = await this.options.find({ where: { tenantId, applicantId } }); return rows.map(x => x.programmeOfferingId); }
  private async requireOffering(tenantId: string, id: string) { const row = await this.offerings.findOneBy({ id, tenantId }); if (!row) throw new NotFoundException('Programme offering not found'); return row; }
  private assertOfferingEditable(row: ProgrammeOfferingEntity) { if (!EDITABLE_OFFERING_STATUSES.includes(row.offeringStatus as any)) throw new ConflictException('Document requirements can only be configured while the offering is editable'); }
  private async requireOwned(user: AuthUser, applicantId: string) { const row = await this.applications.findOneBy({ id: applicantId, tenantId: user.tenantId }); if (!row) throw new NotFoundException('Application not found'); if (row.iamUserId !== user.userId) throw new ForbiddenException('You do not own this application'); return row; }
  private assertSubmitted(app: ApplicationEntity) { if (!['SUBMITTED','COMPLETE'].includes(app.applicationStatus)) throw new BusinessException('Application must be submitted before document actions', HttpStatus.CONFLICT, 'APPLICATION_NOT_SUBMITTED'); }
  private async requireDocument(tenantId: string, applicantId: string | undefined, id: string) { const where: any = { id, tenantId }; if (applicantId) where.applicantId = applicantId; const row = await this.documents.findOneBy(where); if (!row) throw new NotFoundException('Applicant document not found'); return row; }
  private async listByApplicant(tenantId: string, applicantId: string) { const rows = await this.documents.find({ where: { tenantId, applicantId }, order: { createdAt: 'ASC' } }); return Promise.all(rows.map(r => this.getDocumentDto(r))); }
  private async getDocumentDto(row: ApplicantDocumentEntity) { const type = await this.types.findOneBy({ id: row.documentTypeId }); if (!type) throw new NotFoundException('Document type not found'); return this.toDto(row, type); }
  private async toDto(row: ApplicantDocumentEntity, type: DocumentTypeEntity) { const rule = await this.requirements.findOneBy({ id: row.offeringRequiredDocumentId, tenantId: row.tenantId }); let fileReference = row.fileReference; if (row.sourceModule === AdmissionDocumentSource.F002 && row.sourceDocumentId) fileReference = (await this.academicDocs.findOneBy({ id: row.sourceDocumentId, tenantId: row.tenantId, applicantId: row.applicantId }))?.fileReference ?? null; return { id: row.id, applicantId: row.applicantId, programmeOfferingId: row.programmeOfferingId, offeringRequiredDocumentId: row.offeringRequiredDocumentId, documentTypeId: row.documentTypeId, documentTypeCode: type.code, documentTypeName: type.name, mandatory: rule?.mandatory ?? true, conditionCode: rule?.conditionCode ?? null, sourceModule: row.sourceModule, sourceDocumentId: row.sourceDocumentId, fileReference, downloadUrl: fileReference ? await this.storage.resolveDownloadUrl(fileReference) : null, fileName: row.fileName, mimeType: row.mimeType, fileSizeBytes: row.fileSizeBytes, status: row.status, resubmissionReason: row.resubmissionReason, submittedAt: row.submittedAt, verifiedAt: row.verifiedAt }; }
  private async saveWithAudit(user: { tenantId: string; userId: string }, row: ApplicantDocumentEntity, action: string, from: string | null, to: string, reason: string | null) { return this.documents.manager.transaction(async manager => { const saved = await manager.getRepository(ApplicantDocumentEntity).save(row); await manager.getRepository(DocumentVerificationAuditEntity).save(manager.getRepository(DocumentVerificationAuditEntity).create({ tenantId: user.tenantId, applicantDocumentId: saved.id, action, fromStatus: from, toStatus: to, reason, actedBy: user.userId })); return saved; }); }
  private matchesSignature(buffer: Buffer, mime: string) { if (mime === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-'; if (mime === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff; if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])); if (mime === 'image/gif') return ['GIF87a','GIF89a'].includes(buffer.subarray(0, 6).toString()); if (mime === 'image/bmp') return buffer.subarray(0, 2).toString() === 'BM'; return false; }
  private assertStaff(user: RequestContext) { if (!(user.roles ?? []).some(r => STAFF_ROLES.has(r.toUpperCase()))) throw new ForbiddenException('Admissions staff role is required'); }
}
