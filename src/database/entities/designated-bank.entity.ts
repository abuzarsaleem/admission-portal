import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'designated_banks' })
export class DesignatedBankEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 150, name: 'bank_name' })
  bankName!: string;

  @Column({ type: 'varchar', length: 150, name: 'branch_name' })
  branchName!: string;

  @Index()
  @Column({ type: 'varchar', length: 50, name: 'branch_code' })
  branchCode!: string;

  @Column({ type: 'varchar', length: 200, name: 'account_title' })
  accountTitle!: string;

  @Column({ type: 'varchar', length: 100, name: 'account_number' })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 1000, name: 'logo_storage_key', nullable: true })
  logoStorageKey!: string | null;

  @Column({ type: 'timestamptz', name: 'effective_from' })
  effectiveFrom!: Date;

  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effectiveTo!: Date | null;

  @Index()
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status!: string;

  @Column({ type: 'varchar', length: 100, name: 'created_by' })
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
