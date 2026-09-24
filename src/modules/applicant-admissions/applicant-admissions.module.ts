import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { GeneralCriterionEntity } from '../../database/entities/general-criterion.entity.js';
import { GeneralFeeEntity } from '../../database/entities/general-fee.entity.js';
import { IntakeEntity } from '../../database/entities/intake.entity.js';
import { OfferingFeeEntity } from '../../database/entities/offering-fee.entity.js';
import { OfferingDeclarationEntity } from '../../database/entities/offering-declaration.entity.js';
import { ProgrammeOfferingEntity } from '../../database/entities/programme-offering.entity.js';
import { ProgrammeEntity } from '../../database/entities/programme.entity.js';
import { ApplicantAdmissionsController } from './applicant-admissions.controller.js';
import { ApplicantAdmissionsService } from './applicant-admissions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntakeEntity,
      ProgrammeOfferingEntity,
      ProgrammeEntity,
      AdmissionCriterionEntity,
      GeneralCriterionEntity,
      OfferingFeeEntity,
      GeneralFeeEntity,
      OfferingDeclarationEntity,
    ]),
  ],
  controllers: [ApplicantAdmissionsController],
  providers: [ApplicantAdmissionsService],
  exports: [ApplicantAdmissionsService],
})
export class ApplicantAdmissionsModule {}
