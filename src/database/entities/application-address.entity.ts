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
import { ApplicationAddressType } from '../../common/enums/application-completion.enum.js';
import { ApplicationEntity } from './application.entity.js';

@Entity({ name: 'application_addresses' })
export class ApplicationAddressEntity {
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

  @Column({ type: 'varchar', length: 30, name: 'address_type' })
  addressType!: ApplicationAddressType;

  @Column({ type: 'varchar', length: 255, name: 'address_line_1' })
  addressLine1!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'address_line_2',
    nullable: true,
  })
  addressLine2!: string | null;

  /** Country master code (external hierarchy; no local FK yet). */
  @Column({ type: 'varchar', length: 50, name: 'country_id' })
  countryId!: string;

  @Column({ type: 'varchar', length: 50, name: 'province_id' })
  provinceId!: string;

  @Column({ type: 'varchar', length: 50, name: 'city_id' })
  cityId!: string;

  @Column({ type: 'varchar', length: 20, name: 'postal_code', nullable: true })
  postalCode!: string | null;

  @Column({ type: 'boolean', name: 'is_same_as_primary', default: false })
  isSameAsPrimary!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
