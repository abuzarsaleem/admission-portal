import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'application_status_audits' })
@Index('idx_application_status_audits_history', ['tenantId', 'applicantId', 'actedAt'])
export class ApplicationStatusAuditEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'applicant_id' }) applicantId!: string;
  @Column({ type: 'varchar', length: 30, name: 'from_status' }) fromStatus!: string;
  @Column({ type: 'varchar', length: 30, name: 'to_status' }) toStatus!: string;
  @Column({ type: 'varchar', length: 60, name: 'reason_code', nullable: true }) reasonCode!: string | null;
  @Column({ type: 'text', nullable: true }) reason!: string | null;
  @Column({ type: 'uuid', name: 'acted_by', nullable: true }) actedBy!: string | null;
  @Column({ type: 'varchar', length: 20, default: 'MANUAL' }) source!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'acted_at' }) actedAt!: Date;
}
