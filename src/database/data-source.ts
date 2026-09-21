import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config.js';
import {
  AdmissionCriterionEntity,
  CriteriaTypeEntity,
  DepartmentEntity,
  FeeTypeEntity,
  GeneralCriterionEntity,
  GeneralFeeEntity,
  IntakeEntity,
  OfferingFeeEntity,
  ProgrammeEntity,
  ProgrammeOfferingEntity,
  SupportingInformationEntity,
} from './entities/index.js';

export const AppDataSource = new DataSource({
  ...buildDatabaseOptions(),
  entities: [
    FeeTypeEntity,
    CriteriaTypeEntity,
    DepartmentEntity,
    ProgrammeEntity,
    GeneralCriterionEntity,
    IntakeEntity,
    ProgrammeOfferingEntity,
    GeneralFeeEntity,
    OfferingFeeEntity,
    AdmissionCriterionEntity,
    SupportingInformationEntity,
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
