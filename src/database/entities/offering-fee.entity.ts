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
import { GeneralFeeEntity } from './general-fee.entity.js';
import { ProgrammeOfferingEntity } from './programme-offering.entity.js';

@Entity({ name: 'offering_fees' })
export class OfferingFeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'programme_offering_id' })
  programmeOfferingId!: string;

  @ManyToOne(() => ProgrammeOfferingEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'programme_offering_id' })
  programmeOffering!: ProgrammeOfferingEntity;

  @Index()
  @Column({ type: 'uuid', name: 'general_fee_id' })
  generalFeeId!: string;

  @ManyToOne(() => GeneralFeeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'general_fee_id' })
  generalFee!: GeneralFeeEntity;

  @Index()
  @Column({ type: 'timestamptz', name: 'effective_from', nullable: true })
  effectiveFrom!: Date | null;

  @Index()
  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effectiveTo!: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status!: string;

  @Index()
  @Column({ type: 'int', name: 'sort_order', nullable: true })
  sortOrder!: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Index()
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Index()
  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy!: string;
}
