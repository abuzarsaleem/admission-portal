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
import { ApplicationEntity } from './application.entity.js';
import { ProgrammeOfferingEntity } from './programme-offering.entity.js';

@Entity({ name: 'application_programme_options' })
export class ApplicationProgrammeOptionEntity {
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
  @Column({ type: 'uuid', name: 'programme_offering_id' })
  programmeOfferingId!: string;

  @ManyToOne(() => ProgrammeOfferingEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'programme_offering_id' })
  programmeOffering!: ProgrammeOfferingEntity;

  @Column({ type: 'smallint', name: 'preference_order' })
  preferenceOrder!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
