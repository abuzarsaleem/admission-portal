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
import { DeclarationTypeEntity } from './declaration-type.entity.js';
import { ProgrammeOfferingEntity } from './programme-offering.entity.js';

@Entity({ name: 'offering_declarations' })
export class OfferingDeclarationEntity {
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
  @Column({ type: 'uuid', name: 'declaration_type_id' })
  declarationTypeId!: string;

  @ManyToOne(() => DeclarationTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'declaration_type_id' })
  declarationType!: DeclarationTypeEntity;

  @Column({ type: 'text', name: 'declaration_text' })
  declarationText!: string;

  @Column({ type: 'varchar', length: 100 })
  version!: string;

  @Index()
  @Column({ type: 'timestamptz', name: 'effective_from' })
  effectiveFrom!: Date;

  @Index()
  @Column({ type: 'timestamptz', name: 'effective_to', nullable: true })
  effectiveTo!: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
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
