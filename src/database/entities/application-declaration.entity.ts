import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationEntity } from './application.entity.js';

@Entity({ name: 'application_declarations' })
export class ApplicationDeclarationEntity {
  @PrimaryColumn({ type: 'uuid', name: 'applicant_id' })
  applicantId!: string;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  application!: ApplicationEntity;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'boolean', name: 'declaration_accepted', default: false })
  declarationAccepted!: boolean;

  @Column({
    type: 'timestamptz',
    name: 'declaration_acceptance_date',
    nullable: true,
  })
  declarationAcceptanceDate!: Date | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'declaration_version',
    nullable: true,
  })
  declarationVersion!: string | null;

  @Column({
    type: 'boolean',
    name: 'disciplinary_issue_declared',
    default: false,
  })
  disciplinaryIssueDeclared!: boolean;

  @Column({ type: 'text', name: 'disciplinary_issue_details', nullable: true })
  disciplinaryIssueDetails!: string | null;

  /** Offering declaration UUIDs the applicant accepted (from offering_declarations). */
  @Column({
    type: 'uuid',
    array: true,
    name: 'accepted_offering_declaration_ids',
    default: '{}',
  })
  acceptedOfferingDeclarationIds!: string[];

  @Column({ type: 'timestamptz', name: 'submission_date', nullable: true })
  submissionDate!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
