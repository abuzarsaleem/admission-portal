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

  /** Numeric threshold for machine evaluation (e.g. 65 for MIN_PERCENTAGE). */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'criteria_value',
    nullable: true,
  })
  criteriaValue!: string | null;

  /** Upper bound when criteria_operator is BETWEEN. */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'criteria_value_max',
    nullable: true,
  })
  criteriaValueMax!: string | null;

  /**
   * Which academic `degree_type` this rule applies to (e.g. FSC).
   * Null = evaluate against the applicant's highest percentage overall.
   */
  @Column({
    type: 'varchar',
    length: 80,
    name: 'applies_to_degree_type',
    nullable: true,
  })
  appliesToDegreeType!: string | null;

  @Column({ type: 'boolean', default: true })
  mandatory!: boolean;
}
