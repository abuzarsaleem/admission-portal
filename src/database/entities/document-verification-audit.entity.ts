import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'document_verification_audits' })
@Index('idx_document_audit_history', ['applicantDocumentId', 'actedAt'])
export class DocumentVerificationAuditEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Index() @Column({ type: 'uuid', name: 'applicant_document_id' }) applicantDocumentId!: string;
  @Column({ type: 'varchar', length: 40 }) action!: string;
  @Column({ type: 'varchar', length: 30, name: 'from_status', nullable: true }) fromStatus!: string | null;
  @Column({ type: 'varchar', length: 30, name: 'to_status' }) toStatus!: string;
  @Column({ type: 'text', nullable: true }) reason!: string | null;
  @Column({ type: 'uuid', name: 'acted_by' }) actedBy!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'acted_at' }) actedAt!: Date;
}
