import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'intakes' })
@Unique('uq_intakes_tenant_code', ['tenantId', 'intakeCode'])
export class IntakeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ type: 'varchar', length: 255, name: 'intake_name' })
  intakeName!: string;

  @Column({ type: 'varchar', length: 100, name: 'intake_code' })
  intakeCode!: string;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status!: string;

  @Index()
  @Column({ type: 'timestamptz', name: 'application_open_at' })
  applicationOpenAt!: Date;

  @Index()
  @Column({ type: 'timestamptz', name: 'application_close_at' })
  applicationCloseAt!: Date;

  @Index()
  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @Index()
  @Column({ type: 'uuid', name: 'published_by', nullable: true })
  publishedBy!: string | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Index()
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @Index()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Index()
  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy!: string;
}
