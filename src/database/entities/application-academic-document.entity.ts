import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  AcademicDocumentType,
  AcademicDocumentVerificationStatus,
} from '../../common/enums/application-completion.enum.js';
import { ApplicationAcademicInformationEntity } from './application-academic-information.entity.js';
import { ApplicationEntity } from './application.entity.js';

@Entity({ name: 'application_academic_documents' })
export class ApplicationAcademicDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'applicant_id' })
  applicantId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  application!: ApplicationEntity;

  @Index()
  @Column({ type: 'uuid', name: 'academic_information_id' })
  academicInformationId!: string;

  @ManyToOne(
    () => ApplicationAcademicInformationEntity,
    (info) => info.documents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'academic_information_id' })
  academicInformation!: ApplicationAcademicInformationEntity;

  @Column({ type: 'varchar', length: 50, name: 'document_type' })
  documentType!: AcademicDocumentType;

  @Column({ type: 'varchar', length: 500, name: 'file_reference' })
  fileReference!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'original_file_name',
    nullable: true,
  })
  originalFileName!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'mime_type', nullable: true })
  mimeType!: string | null;

  @Column({ type: 'int', name: 'file_size', nullable: true })
  fileSize!: number | null;

  @Column({
    type: 'timestamptz',
    name: 'uploaded_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  uploadedAt!: Date;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'verification_status',
    default: AcademicDocumentVerificationStatus.UNVERIFIED,
  })
  verificationStatus!: AcademicDocumentVerificationStatus;
}
