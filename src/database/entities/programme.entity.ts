import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { DepartmentEntity } from './department.entity.js';

@Entity({ name: 'programmes' })
@Unique('uq_programmes_tenant_code', ['tenantId', 'code'])
export class ProgrammeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'department_id' })
  departmentId!: string;

  @ManyToOne(() => DepartmentEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department!: DepartmentEntity;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  code!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 150, name: 'programme_grouping', nullable: true })
  programmeGrouping!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255, name: 'curriculum_reference', nullable: true })
  curriculumReference!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 30, name: 'degree_level' })
  degreeLevel!: string;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status!: string;

  @Index()
  @Column({ type: 'int', name: 'sort_order', nullable: true })
  sortOrder!: number | null;

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
