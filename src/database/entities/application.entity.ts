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
import { IntakeEntity } from './intake.entity.js';

@Entity({ name: 'applications' })
export class ApplicationEntity {
  /** Spec: applicant_id — stable internal PK. */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  /** Spec: application_id — globally unique business identifier. */
  @Index({ unique: true })
  @Column({ type: 'bigint', name: 'application_id' })
  applicationId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, name: 'application_reference' })
  applicationReference!: string;

  @Index()
  @Column({ type: 'uuid', name: 'intake_id' })
  intakeId!: string;

  @ManyToOne(() => IntakeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'intake_id' })
  intake!: IntakeEntity;

  @Column({ type: 'varchar', length: 150, name: 'applicant_name' })
  applicantName!: string;

  @Column({ type: 'varchar', length: 255, name: 'registered_email' })
  registeredEmail!: string;

  @Index()
  @Column({ type: 'varchar', length: 255, name: 'normalized_email' })
  normalizedEmail!: string;

  @Column({ type: 'varchar', length: 30, name: 'cnic_number', nullable: true })
  cnicNumber!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'passport_number',
    nullable: true,
  })
  passportNumber!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 80, name: 'normalized_identity' })
  normalizedIdentity!: string;

  @Column({ type: 'varchar', length: 30, name: 'mobile_number' })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telephone!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'domicile_id', nullable: true })
  domicileId!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gender!: string | null;

  @Column({ type: 'varchar', length: 30, name: 'marital_status', nullable: true })
  maritalStatus!: string | null;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'profile_photograph',
    nullable: true,
  })
  profilePhotograph!: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'primary_nationality_id',
    nullable: true,
  })
  primaryNationalityId!: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'secondary_nationality_id',
    nullable: true,
  })
  secondaryNationalityId!: string | null;

  @Column({ type: 'boolean', name: 'disability_declared', nullable: true })
  disabilityDeclared!: boolean | null;

  @Column({ type: 'varchar', length: 50, name: 'referral_source', nullable: true })
  referralSource!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 30, name: 'application_status' })
  applicationStatus!: string;

  @Column({ type: 'int', name: 'overall_completion', default: 0 })
  overallCompletion!: number;

  @Column({ type: 'timestamptz', name: 'registration_date' })
  registrationDate!: Date;

  @Column({ type: 'timestamptz', name: 'applied_date', nullable: true })
  appliedDate!: Date | null;

  @Column({ type: 'boolean', name: 'academic_step_saved', default: false })
  academicStepSaved!: boolean;

  @Column({ type: 'boolean', name: 'programme_step_saved', default: false })
  programmeStepSaved!: boolean;

  @Column({ type: 'boolean', name: 'profile_step_saved', default: false })
  profileStepSaved!: boolean;

  @Column({ type: 'boolean', name: 'declaration_step_saved', default: false })
  declarationStepSaved!: boolean;

  @Column({ type: 'timestamptz', name: 'submission_date', nullable: true })
  submissionDate!: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 30, name: 'account_status' })
  accountStatus!: string;

  @Index()
  @Column({ type: 'uuid', name: 'iam_user_id', nullable: true })
  iamUserId!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
