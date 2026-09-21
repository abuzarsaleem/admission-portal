import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CriteriaTypeEntity } from './criteria-type.entity.js';

@Entity({ name: 'general_criteria' })
export class GeneralCriterionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'criteria_type_id' })
  criteriaTypeId!: string;

  @ManyToOne(() => CriteriaTypeEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'criteria_type_id' })
  criteriaType!: CriteriaTypeEntity;

  @Column({ type: 'varchar', length: 150, name: 'criteria_name', nullable: true })
  criteriaName!: string | null;

  @Column({ type: 'text', name: 'criteria_requirement' })
  criteriaRequirement!: string;

  @Column({ type: 'varchar', length: 30, name: 'criteria_operator', nullable: true })
  criteriaOperator!: string | null;

  @Column({ type: 'varchar', length: 30, name: 'criteria_unit', nullable: true })
  criteriaUnit!: string | null;

  @Column({ type: 'boolean', default: true })
  mandatory!: boolean;
}
