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
import { ProcessingFeeChallanEntity } from './processing-fee-challan.entity.js';

@Entity({ name: 'processing_fee_challan_items' })
export class ProcessingFeeChallanItemEntity {
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

  @Column({ type: 'varchar', length: 50, name: 'fee_type_code' })
  feeTypeCode!: string;

  @Column({ type: 'varchar', length: 200 })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  quantity!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, name: 'unit_amount' })
  unitAmount!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'timestamptz', name: 'due_date', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'varchar', length: 100, name: 'source_reference', nullable: true })
  sourceReference!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
