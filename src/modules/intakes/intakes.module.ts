import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionCriterionEntity } from '../../database/entities/admission-criterion.entity.js';
import { IntakeEntity } from '../../database/entities/intake.entity.js';
import { OfferingFeeEntity } from '../../database/entities/offering-fee.entity.js';
import { ProgrammeOfferingEntity } from '../../database/entities/programme-offering.entity.js';
import { SupportingInformationEntity } from '../../database/entities/supporting-information.entity.js';
import { IntakeWorkflowController } from './intake-workflow.controller.js';
import { IntakeWorkflowService } from './intake-workflow.service.js';
import { IntakesController } from './intakes.controller.js';
import { IntakesService } from './intakes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntakeEntity,
      ProgrammeOfferingEntity,
      AdmissionCriterionEntity,
      OfferingFeeEntity,
      SupportingInformationEntity,
    ]),
  ],
  controllers: [IntakesController, IntakeWorkflowController],
  providers: [IntakesService, IntakeWorkflowService],
  exports: [IntakesService, IntakeWorkflowService],
})
export class IntakesModule {}
