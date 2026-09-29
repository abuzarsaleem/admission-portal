import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  PaymentEvidenceSource,
  PaymentEvidenceVerificationIndicator,
} from '../../common/enums/processing-fee.enum.js';
import { ApplicationEntity } from './application.entity.js';
import { ProcessingFeeChallanEntity } from './processing-fee-challan.entity.js';

@Entity({ name: 'payment_evidence' })
@Index('uq_payment_evidence_one_current_per_challan', ['challanId'], {
  unique: true,
  where: 'is_current = true',
})
export class PaymentEvidenceEntity {
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
  @Column({ type: 'uuid', name: 'challan_id' })
  challanId!: string;

  @ManyToOne(() => ProcessingFeeChallanEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challan_id' })
  challan!: ProcessingFeeChallanEntity;

  @Index()
  @Column({
    type: 'uuid',
    name: 'online_payment_transaction_id',
    nullable: true,
  })
  onlinePaymentTransactionId!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'storage_key' })
  storageKey!: string;

  @Column({ type: 'varchar', length: 10, name: 'file_format' })
  fileFormat!: string;

  @Column({ type: 'varchar', length: 30, name: 'evidence_source' })
  evidenceSource!: PaymentEvidenceSource;

  @CreateDateColumn({ type: 'timestamptz', name: 'upload_date' })
  uploadDate!: Date;

  @Index()
  @Column({
    type: 'varchar',
    length: 30,
    name: 'verification_indicator',
    default: PaymentEvidenceVerificationIndicator.UNVERIFIED,
  })
  verificationIndicator!: PaymentEvidenceVerificationIndicator;

  @Column({ type: 'varchar', length: 100, name: 'verified_by', nullable: true })
  verifiedBy!: string | null;

  @Column({ type: 'timestamptz', name: 'verification_date', nullable: true })
  verificationDate!: Date | null;

  @Column({ type: 'uuid', name: 'replaced_by', nullable: true })
  replacedBy!: string | null;

  @Index()
  @Column({ type: 'boolean', name: 'is_current', default: true })
  isCurrent!: boolean;
}
