import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

const entities = [
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
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        ...buildDatabaseOptions(),
        entities,
        synchronize: false,
        migrationsRun: false,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
