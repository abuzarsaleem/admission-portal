import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankImportStatus } from '../../common/enums/processing-fee.enum.js';

@Entity({ name: 'bank_reconciliation_imports' })
export class BankReconciliationImportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'import_date' })
  importDate!: Date;

  @Column({ type: 'varchar', length: 500, name: 'file_reference' })
  fileReference!: string;

  @Column({ type: 'int', name: 'total_records', default: 0 })
  totalRecords!: number;

  @Column({ type: 'int', name: 'matched_records', default: 0 })
  matchedRecords!: number;

  @Column({ type: 'int', name: 'exception_records', default: 0 })
  exceptionRecords!: number;

  @Column({ type: 'varchar', length: 100, name: 'imported_by' })
  importedBy!: string;

  @Column({ type: 'varchar', length: 20, name: 'import_status', default: BankImportStatus.COMPLETE })
  importStatus!: BankImportStatus;

  @Column({ type: 'varchar', length: 20, name: 'source_format', default: 'CSV' })
  sourceFormat!: string;

  @Column({ type: 'varchar', length: 128, name: 'source_columns_hash', nullable: true })
  sourceColumnsHash!: string | null;
}
