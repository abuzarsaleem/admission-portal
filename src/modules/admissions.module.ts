import { Module } from '@nestjs/common';
import { AdmissionCriteriaModule } from './admission-criteria/admission-criteria.module.js';
import { ApplicantAdmissionsModule } from './applicant-admissions/applicant-admissions.module.js';
import { CriteriaTypesModule } from './criteria-types/criteria-types.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { FeeTypesModule } from './fee-types/fee-types.module.js';
import { IntakesModule } from './intakes/intakes.module.js';
import { OfferingFeesModule } from './offering-fees/offering-fees.module.js';
import { ProgrammeFeesModule } from './programme-fees/programme-fees.module.js';
import { ProgrammeOfferingsModule } from './programme-offerings/programme-offerings.module.js';
import { ProgrammesModule } from './programmes/programmes.module.js';
import { SupportingInformationModule } from './supporting-information/supporting-information.module.js';

/**
 * ADM-F000 domain aggregate — Intake & Offering Management.
 */
@Module({
  imports: [
    DepartmentsModule,
    ProgrammesModule,
    CriteriaTypesModule,
    FeeTypesModule,
    IntakesModule,
    ProgrammeOfferingsModule,
    AdmissionCriteriaModule,
    ProgrammeFeesModule,
    OfferingFeesModule,
    SupportingInformationModule,
    ApplicantAdmissionsModule,
  ],
  exports: [
    DepartmentsModule,
    ProgrammesModule,
    CriteriaTypesModule,
    FeeTypesModule,
    IntakesModule,
    ProgrammeOfferingsModule,
    AdmissionCriteriaModule,
    ProgrammeFeesModule,
    OfferingFeesModule,
    SupportingInformationModule,
    ApplicantAdmissionsModule,
  ],
})
export class AdmissionsModule {}
