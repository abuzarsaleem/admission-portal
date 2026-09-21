import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { CriteriaTypeEntity } from '../../database/entities/criteria-type.entity.js';
import { GeneralCriterionEntity } from '../../database/entities/general-criterion.entity.js';
import { ProgrammeOfferingsModule } from '../programme-offerings/programme-offerings.module.js';
import { AdmissionCriteriaController } from './admission-criteria.controller.js';
import { AdmissionCriteriaService } from './admission-criteria.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdmissionCriterionEntity,
      GeneralCriterionEntity,
      CriteriaTypeEntity,
    ]),
    ProgrammeOfferingsModule,
  ],
  controllers: [AdmissionCriteriaController],
  providers: [AdmissionCriteriaService],
  exports: [AdmissionCriteriaService],
})
export class AdmissionCriteriaModule {}
