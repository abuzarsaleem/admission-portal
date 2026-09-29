import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  OnlinePaymentMethod,
  OnlinePaymentStatus,
} from '../../common/enums/processing-fee.enum.js';
import { ApplicationEntity } from './application.entity.js';
import { ProcessingFeeChallanEntity } from './processing-fee-challan.entity.js';

@Entity({ name: 'online_payment_transactions' })
@Index('uq_online_payment_transaction_reference', ['tenantId', 'transactionReference'], { unique: true })
export class OnlinePaymentTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'challan_id' })
  challanId!: string;

  @ManyToOne(() => ProcessingFeeChallanEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challan_id' })
  challan!: ProcessingFeeChallanEntity;

  @Index()
  @Column({ type: 'uuid', name: 'applicant_id' })
  applicantId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  application!: ApplicationEntity;

  @Column({ type: 'varchar', length: 30, name: 'payment_method' })
  paymentMethod!: OnlinePaymentMethod;

  @Column({ type: 'varchar', length: 150, name: 'transaction_reference' })
  transactionReference!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 150, name: 'sender_name' })
  senderName!: string;

  @Index()
  @Column({ type: 'varchar', length: 30, default: OnlinePaymentStatus.INITIATED })
  status!: OnlinePaymentStatus;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'confirmed_at', nullable: true })
  confirmedAt!: Date | null;

  @Column({ type: 'varchar', length: 60, name: 'provider_code', nullable: true })
  providerCode!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
