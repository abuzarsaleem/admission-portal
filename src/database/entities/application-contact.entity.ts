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
import { ApplicationContactType } from '../../common/enums/application-completion.enum.js';
import { ApplicationEntity } from './application.entity.js';

@Entity({ name: 'application_contacts' })
export class ApplicationContactEntity {
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

  @Column({ type: 'varchar', length: 30, name: 'contact_type' })
  contactType!: ApplicationContactType;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'identity_document_number',
    nullable: true,
  })
  identityDocumentNumber!: string | null;

  @Column({ type: 'varchar', length: 80 })
  relationship!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  occupation!: string | null;

  @Column({ type: 'varchar', length: 30, name: 'mobile_number' })
  mobileNumber!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telephone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'address_line', nullable: true })
  addressLine!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
