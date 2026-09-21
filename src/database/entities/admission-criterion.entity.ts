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
import { GeneralCriterionEntity } from './general-criterion.entity.js';
import { ProgrammeOfferingEntity } from './programme-offering.entity.js';

@Entity({ name: 'admission_criteria' })
export class AdmissionCriterionEntity {
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
  @Column({ type: 'uuid', name: 'general_criteria_id' })
  generalCriteriaId!: string;

  @ManyToOne(() => GeneralCriterionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'general_criteria_id' })
  generalCriteria!: GeneralCriterionEntity;

  @Index()
  @Column({ type: 'int', name: 'sequence_no', nullable: true })
  sequenceNo!: number | null;

  @Index()
  @Column({ type: 'timestamptz', name: 'effective_from', nullable: true })
  effectiveFrom!: Date | null;

  @Index()
  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effectiveTo!: Date | null;

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
