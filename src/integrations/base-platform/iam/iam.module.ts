import { Module } from '@nestjs/common';
import { IamApplicantRegistrationService } from './iam-applicant-registration.service.js';
import { IamService } from './iam.service.js';

@Module({
  providers: [IamService, IamApplicantRegistrationService],
  exports: [IamService, IamApplicantRegistrationService],
})
export class IamModule {}
