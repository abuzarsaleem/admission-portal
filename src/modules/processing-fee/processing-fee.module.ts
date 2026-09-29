import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationEntity,
  ApplicationProgrammeOptionEntity,
  BankReconciliationImportEntity,
  BankReconciliationRecordEntity,
  DesignatedBankEntity,
  GeneralFeeEntity,
  IntakeEntity,
  OnlinePaymentTransactionEntity,
  OfferingFeeEntity,
  PaymentEvidenceEntity,
  ProcessingFeeChallanEntity,
  ProcessingFeeChallanItemEntity,
  ProgrammeOfferingEntity,
} from '../../database/entities/index.js';
import { StorageModule } from '../../integrations/storage/storage.module.js';
import { ApplicantProcessingFeeController } from './applicant-processing-fee.controller.js';
import {
  BankReconciliationController,
  ProcessingFeeAdminController,
} from './processing-fee-admin.controller.js';
import { ProcessingFeeService } from './processing-fee.service.js';

@Module({
  imports: [
    StorageModule,
    TypeOrmModule.forFeature([
      ApplicationEntity,
      ApplicationProgrammeOptionEntity,
      ProgrammeOfferingEntity,
      IntakeEntity,
      OfferingFeeEntity,
      GeneralFeeEntity,
      ProcessingFeeChallanEntity,
      ProcessingFeeChallanItemEntity,
      DesignatedBankEntity,
      PaymentEvidenceEntity,
      OnlinePaymentTransactionEntity,
      BankReconciliationImportEntity,
      BankReconciliationRecordEntity,
    ]),
  ],
  controllers: [
    ApplicantProcessingFeeController,
    ProcessingFeeAdminController,
    BankReconciliationController,
  ],
  providers: [ProcessingFeeService],
  exports: [ProcessingFeeService],
})
export class ProcessingFeeModule {}
