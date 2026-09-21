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
import { ProgrammeOfferingEntity } from './programme-offering.entity.js';

@Entity({ name: 'supporting_information' })
export class SupportingInformationEntity {
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
  @Column({ type: 'varchar', length: 50, name: 'information_type' })
  informationType!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 1000, name: 'reference_url', nullable: true })
  referenceUrl!: string | null;

  @Column({ type: 'boolean', default: false })
  mandatory!: boolean;

  @Index()
  @Column({ type: 'int', name: 'display_order', nullable: true })
  displayOrder!: number | null;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status!: string;

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
