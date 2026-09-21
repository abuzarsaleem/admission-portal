import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { CriteriaTypeEntity } from '../../database/entities/criteria-type.entity.js';
import { GeneralCriterionEntity } from '../../database/entities/general-criterion.entity.js';
import { GeneralCriteriaController } from './general-criteria.controller.js';
import { GeneralCriteriaService } from './general-criteria.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneralCriterionEntity,
      CriteriaTypeEntity,
      AdmissionCriterionEntity,
    ]),
  ],
  controllers: [GeneralCriteriaController],
  providers: [GeneralCriteriaService],
  exports: [GeneralCriteriaService],
})
export class GeneralCriteriaModule {}
