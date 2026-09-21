import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Lookup catalogue for approved fee type names (Excel: fee_types). */
@Entity({ name: 'fee_types' })
export class FeeTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;
}
